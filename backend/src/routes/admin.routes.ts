import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/index';

const router = Router();

function requireAdmin(req: Request, res: Response): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    res.status(500).json({ error: 'ADMIN_TOKEN is not configured' });
    return false;
  }
  const got = req.header('x-admin-token');
  if (!got || got !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/scam-reports', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const result = await pool.query(
    `SELECT id, content, pattern_type, status, created_at
     FROM scam_reports
     ORDER BY created_at DESC
     LIMIT 200`
  );
  return res.json(result.rows);
});

const UpdateReportSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

router.patch('/scam-reports/:id', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const parsed = UpdateReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });

  await pool.query(`UPDATE scam_reports SET status = $1 WHERE id = $2`, [parsed.data.status, req.params.id]);
  return res.json({ success: true });
});

export default router;

