import { Router, Request, Response } from 'express';
import { pool } from '../db/index';
import { getAIResponse } from '../services/ai.service';
import { Content } from '@google/generative-ai';

const router = Router();

async function isSessionLinkedToAccount(sessionId: string): Promise<boolean> {
  const result = await pool.query(`SELECT 1 FROM account_sessions WHERE session_id = $1`, [sessionId]);
  return (result.rowCount ?? 0) > 0;
}

async function incrementGuestUsage(sessionId: string): Promise<number> {
  const result = await pool.query(
    `INSERT INTO guest_usage (session_id, user_message_count, updated_at)
     VALUES ($1, 1, NOW())
     ON CONFLICT (session_id)
     DO UPDATE SET user_message_count = guest_usage.user_message_count + 1, updated_at = NOW()
     RETURNING user_message_count`,
    [sessionId]
  );
  return result.rows[0].user_message_count as number;
}

async function getGuestUsage(sessionId: string): Promise<number> {
  const result = await pool.query(`SELECT user_message_count FROM guest_usage WHERE session_id = $1`, [sessionId]);
  return (result.rows[0]?.user_message_count as number | undefined) ?? 0;
}

// POST /api/chat — send message, get AI reply
router.post('/', async (req: Request, res: Response) => {
  const { sessionId, conversationId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  console.log(`💬 Chat Request: [Session: ${sessionId}] [Message: ${message.substring(0, 50)}...]`);

  // Handle DB connection and logic
  try {
    const isDbConnected = await pool.query('SELECT 1').then(() => true).catch(() => false);
    
    if (!isDbConnected) {
      console.warn('⚠️ Database unavailable, using stateless mock mode for this request.');
      const aiResponse = await getAIResponse([], message);
      return res.json({ conversationId: 'mock-conv', response: aiResponse });
    }

    const linked = await isSessionLinkedToAccount(sessionId);
    if (!linked) {
      const used = await getGuestUsage(sessionId);
      if (used >= 30) { // Increased for better experience
        return res.status(402).json({
          error: 'Guest limit reached. Create an account to continue.',
          code: 'GUEST_LIMIT',
        });
      }
    }

    const client = await pool.connect();
    try {
      let convId = conversationId;
      if (!convId) {
        const convResult = await client.query(
          `INSERT INTO conversations (session_id, title) VALUES ($1, $2) RETURNING id`,
          [sessionId, message.substring(0, 60)]
        );
        convId = convResult.rows[0].id;
      }

      const historyResult = await client.query(
        `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [convId]
      );

      const history: Content[] = historyResult.rows.map((row) => ({
        role: row.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: row.content }],
      }));

      console.log(`🤖 Requesting AI response for session ${sessionId}...`);
      const aiResponse = await getAIResponse(history, message);
      console.log(`✅ AI Response received (${aiResponse.length} chars)`);

      await client.query(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
        [convId, message, aiResponse]
      );

      if (!linked) await incrementGuestUsage(sessionId);
      await client.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [convId]);

      return res.json({ conversationId: convId, response: aiResponse });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      error: error.message || 'System error. Please try again later.',
      response: 'I encountered an unexpected error. Please check the logs.'
    });
  }
});

// GET /api/chat/conversations/:sessionId
router.get('/conversations/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at FROM conversations WHERE session_id = $1 ORDER BY updated_at DESC`,
      [sessionId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.warn('DB unavailable for conversations fetch, returning empty list.');
    return res.json([]);
  }
});

// GET /api/chat/conversations/:conversationId/messages
router.get('/conversation/:conversationId/messages', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// DELETE /api/chat/conversation/:conversationId
router.delete('/conversation/:conversationId', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  try {
    await pool.query(`DELETE FROM conversations WHERE id = $1`, [conversationId]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
