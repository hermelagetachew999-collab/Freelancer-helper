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

  const { status } = parsed.data;

  // If approved, sync to scam_patterns
  if (status === 'approved') {
    const report = await pool.query(`SELECT content, pattern_type FROM scam_reports WHERE id = $1`, [
      req.params.id,
    ]);
    if (report.rows[0]) {
      const { content, pattern_type } = report.rows[0];
      await pool.query(
        `INSERT INTO scam_patterns (pattern_type, pattern_text)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [pattern_type || 'other', content.slice(0, 300)]
      );
    }
  }

  await pool.query(`UPDATE scam_reports SET status = $1 WHERE id = $2`, [status, req.params.id]);
  return res.json({ success: true });
});

// CMS: Content Management
router.get('/content', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const guides = await pool.query(
    `SELECT id, guide_type, slug, title, content_md, last_verified, updated_at
     FROM guides
     ORDER BY updated_at DESC`
  );
  return res.json(guides.rows);
});

const ContentSchema = z.object({
  guide_type: z.enum(['payment', 'platform', 'blog']),
  slug: z.string().min(2),
  title: z.string().min(2),
  content_md: z.string().min(10),
  last_verified: z.string().optional().nullable(),
});

router.post('/content', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const parsed = ContentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { guide_type, slug, title, content_md, last_verified } = parsed.data;
  const result = await pool.query(
    `INSERT INTO guides (guide_type, slug, title, content_md, last_verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [guide_type, slug, title, content_md, last_verified || null]
  );
  return res.json(result.rows[0]);
});

router.patch('/content/:id', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const parsed = ContentSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const fields = Object.keys(parsed.data);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = Object.values(parsed.data);
  values.push(req.params.id);

  await pool.query(
    `UPDATE guides SET ${setClause}, updated_at = NOW() WHERE id = $${values.length}`,
    values
  );
  return res.json({ success: true });
});

router.delete('/content/:id', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  await pool.query(`DELETE FROM guides WHERE id = $1`, [req.params.id]);
  return res.json({ success: true });
});

export default router;

