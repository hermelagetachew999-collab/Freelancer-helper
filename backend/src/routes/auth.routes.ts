import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/index';

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  sessionId: z.string().min(5).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
  sessionId: z.string().min(5).optional(),
});

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

function issueToken(accountId: string) {
  return jwt.sign({ sub: accountId }, getJwtSecret(), { expiresIn: '30d' });
}

function setAuthCookie(res: Response, token: string) {
  res.cookie('fc_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

async function linkSessionToAccount(sessionId: string, accountId: string) {
  await pool.query(
    `INSERT INTO account_sessions (session_id, account_id)
     VALUES ($1, $2)
     ON CONFLICT (session_id) DO UPDATE SET account_id = EXCLUDED.account_id`,
    [sessionId, accountId]
  );
}

router.post('/signup', async (req: Request, res: Response) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });

  const { email, password, sessionId } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO accounts (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email.toLowerCase(), passwordHash]
    );
    const account = result.rows[0];
    const token = issueToken(account.id);
    setAuthCookie(res, token);

    if (sessionId) await linkSessionToAccount(sessionId, account.id);

    return res.json({ account });
  } catch (e: any) {
    if (e?.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error('Signup error:', e);
    return res.status(500).json({ error: 'Failed to sign up' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });

  const { email, password, sessionId } = parsed.data;
  try {
    const result = await pool.query(`SELECT id, email, password_hash, created_at FROM accounts WHERE email = $1`, [
      email.toLowerCase(),
    ]);
    const account = result.rows[0];
    if (!account) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, account.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = issueToken(account.id);
    setAuthCookie(res, token);

    if (sessionId) await linkSessionToAccount(sessionId, account.id);

    return res.json({ account: { id: account.id, email: account.email, created_at: account.created_at } });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('fc_auth', { path: '/' });
  return res.json({ success: true });
});

router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.fc_auth;
  if (!token) return res.json({ account: null });
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string };
    const result = await pool.query(`SELECT id, email, created_at FROM accounts WHERE id = $1`, [payload.sub]);
    return res.json({ account: result.rows[0] || null });
  } catch {
    return res.json({ account: null });
  }
});

export default router;

