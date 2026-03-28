import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/index';

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
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

  const { email, password, firstName, lastName, sessionId } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO accounts (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name as "firstName", last_name as "lastName", created_at`,
      [email.toLowerCase(), passwordHash, firstName || null, lastName || null]
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
    const result = await pool.query(`SELECT id, email, password_hash, first_name as "firstName", last_name as "lastName", created_at FROM accounts WHERE email = $1`, [
      email.toLowerCase(),
    ]);
    const account = result.rows[0];
    if (!account) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, account.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = issueToken(account.id);
    setAuthCookie(res, token);

    if (sessionId) await linkSessionToAccount(sessionId, account.id);

    return res.json({ account: { id: account.id, email: account.email, firstName: account.firstName, lastName: account.lastName, created_at: account.created_at } });
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
    const result = await pool.query(`SELECT id, email, first_name as "firstName", last_name as "lastName", created_at FROM accounts WHERE id = $1`, [payload.sub]);
    return res.json({ account: result.rows[0] || null });
  } catch {
    return res.json({ account: null });
  }
});

// FORGOT PASSWORD - Generate and "send" code
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await pool.query('SELECT id FROM accounts WHERE email = $1', [email.toLowerCase()]);
    if (user.rowCount === 0) {
      // Security: don't reveal if user exists, but for this app's context we can be helpful OR silent.
      // Let's be silent but return success to avoid enumeration.
      return res.json({ success: true, message: 'If an account exists, a code was sent.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await pool.query(
      'INSERT INTO password_reset_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email.toLowerCase(), code, expiresAt]
    );

    console.log(`\n--- VERIFICATION CODE FOR ${email} ---\nCODE: ${code}\n-----------------------------------\n`);

    return res.json({ success: true, message: 'Verification code sent to your email (check server console).' });
  } catch (e) {
    console.error('Forgot password error:', e);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// RESET PASSWORD - Verify code and update password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM password_reset_codes WHERE email = $1 AND code = $2 AND expires_at > NOW()',
      [email.toLowerCase(), code]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE accounts SET password_hash = $1 WHERE email = $2', [passwordHash, email.toLowerCase()]);
    
    // Clean up codes for this email
    await pool.query('DELETE FROM password_reset_codes WHERE email = $1', [email.toLowerCase()]);

    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (e) {
    console.error('Reset password error:', e);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

