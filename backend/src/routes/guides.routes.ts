import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/index';

const router = Router();

const GuideTypeSchema = z.enum(['payment', 'platform', 'blog']);

router.get('/:type', async (req: Request, res: Response) => {
  const parsed = GuideTypeSchema.safeParse(req.params.type);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid guide type' });

  const type = parsed.data;
  const result = await pool.query(
    `SELECT id, slug, title, last_verified, updated_at
     FROM guides
     WHERE guide_type = $1
     ORDER BY updated_at DESC`,
    [type]
  );
  return res.json(result.rows);
});

router.get('/:type/:slug', async (req: Request, res: Response) => {
  const typeParsed = GuideTypeSchema.safeParse(req.params.type);
  if (!typeParsed.success) return res.status(400).json({ error: 'Invalid guide type' });

  const { slug } = req.params;
  const result = await pool.query(
    `SELECT id, slug, title, content_md, last_verified, updated_at
     FROM guides
     WHERE guide_type = $1 AND slug = $2`,
    [typeParsed.data, slug]
  );
  const guide = result.rows[0];
  if (!guide) return res.status(404).json({ error: 'Guide not found' });

  const votes = await pool.query(
    `SELECT
       SUM(CASE WHEN helpful THEN 1 ELSE 0 END)::int AS helpful,
       SUM(CASE WHEN NOT helpful THEN 1 ELSE 0 END)::int AS not_helpful
     FROM guide_votes
     WHERE guide_id = $1`,
    [guide.id]
  );

  return res.json({ ...guide, votes: votes.rows[0] || { helpful: 0, not_helpful: 0 } });
});

const VoteSchema = z.object({
  sessionId: z.string().min(5),
  helpful: z.boolean(),
});

router.post('/:type/:slug/vote', async (req: Request, res: Response) => {
  const typeParsed = GuideTypeSchema.safeParse(req.params.type);
  if (!typeParsed.success) return res.status(400).json({ error: 'Invalid guide type' });

  const voteParsed = VoteSchema.safeParse(req.body);
  if (!voteParsed.success) return res.status(400).json({ error: 'Invalid vote payload' });

  const { slug } = req.params;
  const guideResult = await pool.query(`SELECT id FROM guides WHERE guide_type = $1 AND slug = $2`, [
    typeParsed.data,
    slug,
  ]);
  const guide = guideResult.rows[0];
  if (!guide) return res.status(404).json({ error: 'Guide not found' });

  await pool.query(
    `INSERT INTO guide_votes (guide_id, session_id, helpful)
     VALUES ($1, $2, $3)
     ON CONFLICT (guide_id, session_id) DO UPDATE SET helpful = EXCLUDED.helpful`,
    [guide.id, voteParsed.data.sessionId, voteParsed.data.helpful]
  );

  return res.json({ success: true });
});

export default router;

