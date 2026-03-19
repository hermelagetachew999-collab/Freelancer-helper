import { Router, Request, Response } from 'express';
import { analyzeScamRisk } from '../services/ai.service';
import { pool } from '../db/index';

const router = Router();

// POST /api/scam/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || text.trim().length < 20) {
    return res.status(400).json({ error: 'Please provide more text to analyze (minimum 20 characters)' });
  }
  try {
    const result = await analyzeScamRisk(text);
    return res.json(result);
  } catch (error) {
    console.error('Scam analysis error:', error);
    const msg = (error as Error)?.message;
    return res.status(500).json({ error: msg || 'Failed to analyze text' });
  }
});

// POST /api/scam/report
router.post('/report', async (req: Request, res: Response) => {
  const { content, patternType } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  try {
    await pool.query(
      `INSERT INTO scam_reports (content, pattern_type) VALUES ($1, $2)`,
      [content, patternType || null]
    );
    return res.json({ success: true, message: 'Thank you! Our team will review this scam report.' });
  } catch (error) {
    console.error('Scam report error:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

export default router;
