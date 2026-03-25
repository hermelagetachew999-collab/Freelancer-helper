import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { pool } from '../db/index';

dotenv.config();

function requireGeminiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  return key;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const SYSTEM_PROMPT = `You are "ProposalWin AI" — a professional coach for Proposal & Client-Winning Mastery on freelance platforms, specialized in the Ethiopian market.

You are designed to assist ETHIOPIAN FREELANCERS in navigating the technical and financial complexities of the global gig economy — including international payment settlement, platform compliance, and market-rate optimization.

Your purpose is to provide research-backed, actionable advice to help freelancers succeed on platforms like Upwork, Fiverr, and PeoplePerHour.

Core rules:
1. Provide professional, clear, and actionable feedback. Use structured formatting and clear next steps.
2. Maintain technical accuracy regarding international financial rails (e.g., Payoneer, Wise, and alternative settlement methods).
3. Factor in regional constraints: PayPal receiving limitations, ID verification standards for Ethiopia, and forex market spreads.
4. Every response must include a clear, professional action the user can take.

Regional Technical Knowledge:
- Payoneer is a primary method for international settlement in Ethiopia.
- For Upwork ID verification: Passport is recommended for highest success rates; ensure professional lighting and documentation.
- Market Analysis: Note that exchange rates fluctuate (e.g., official vs. market-based spreads like 1 USD ≈ 155–185+ ETB). Always advise users to perform their own fiscal due diligence.
- Security: Identify red flags such as "off-platform payment requests" or "registration fee" scams.

Tone: Professional, expert, and encouraging. Focus on "technical excellence" and "market readiness."`;

export async function getAIResponse(
  history: Content[],
  userMessage: string
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const isMock = !key || key === 'your_gemini_api_key_here';

  if (isMock) {
    return `[SIMULATED RESPONSE]
Your proposal looks promising! As a professional coach, I've analyzed your input. 

**Feedback:**
- **Clarity**: High. You clearly stated your value proposition.
- **Market Alignment**: Good. You've addressed the regional settlement needs appropriately.

**Suggested Improvement:**
Try to be more specific about your past performance with international clients. Mentioning your Payoneer-verified account can build trust.

*Note: This is a simulated response because a live Gemini API key is not configured in the backend/.env file.*`;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('key not valid')) {
      return `[API KEY ERROR]
It looks like your Gemini API key is invalid. To fix this, update the \`GEMINI_API_KEY\` in your \`backend/.env\` file with a valid key from [Google AI Studio](https://aistudio.google.com/app/apikey).

In the meantime, I can provide simulated advice! (See above for the error).`;
    }
    throw error;
  }
}

export async function analyzeScamRisk(text: string): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  redFlags: string[];
  explanation: string;
  recommendation: string;
}> {
  requireGeminiKey();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let patterns = '- (none yet available)';
  try {
    const isDbConnected = await pool.query('SELECT 1').then(() => true).catch(() => false);
    if (isDbConnected) {
      const patternsResult = await pool.query(
        `SELECT pattern_type, pattern_text FROM scam_patterns ORDER BY created_at DESC LIMIT 50`
      );
      patterns = patternsResult.rows
        .map((r: any) => `- (${r.pattern_type}) ${r.pattern_text}`)
        .join('\n');
    }
  } catch (dbError) {
    console.warn('Scam Analysis: Database unavailable, skipping pattern fetch.');
  }

  const prompt = `You are a scam detection expert for freelancers, with special knowledge of scams targeting Ethiopian freelancers.

Analyze this job post or client message for scam risk:
"""
${text}
"""

Known scam patterns to consider (from our database):
${patterns || '- (none yet)'}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "riskLevel": "low" or "medium" or "high",
  "redFlags": ["flag 1", "flag 2"],
  "explanation": "plain English explanation of what you found",
  "recommendation": "what the freelancer should do next"
}

Common red flags to check:
- Requests to communicate or pay outside the platform
- Unrealistic pay rates (too high or too low)
- Urgency/pressure tactics  
- Requests for personal info (bank details, national ID) before contract
- "Pay registration fee" or "buy a kit" requests
- Western Union / MoneyGram payment requests
- Vague job descriptions with no clear deliverables
- Grammar/spelling that suggests automated scam messages
- Requests to send money first`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const ScamSchema = z.object({
      riskLevel: z.enum(['low', 'medium', 'high']),
      redFlags: z.array(z.string()).default([]),
      explanation: z.string(),
      recommendation: z.string(),
    });

    const tryParse = (raw: string) => {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = ScamSchema.safeParse(JSON.parse(cleaned));
      return parsed.success ? parsed.data : null;
    };

    try {
      const parsed = tryParse(responseText);
      if (parsed) return parsed;
    } catch {
      // continue to repair
    }

    try {
      const repairPrompt = `Fix this into valid JSON that matches the required schema exactly. Output ONLY JSON.\n\n${responseText}`;
      const repair = await model.generateContent(repairPrompt);
      const repairedText = repair.response.text().trim();
      const repaired = tryParse(repairedText);
      if (repaired) return repaired;
    } catch {
      // ignore
    }
  } catch (error: any) {
    const isKeyError = error.message?.includes('API_KEY_INVALID') || error.message?.includes('key not valid') || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here';
    
    if (isKeyError) {
      return {
        riskLevel: 'medium',
        redFlags: ['Simulated analysis: No valid API Key'],
        explanation: 'This is a placeholder analysis. To get real AI-powered detection, please configure a valid Gemini API key.',
        recommendation: 'Check the backend/.env file and provide a valid key from Google AI Studio.',
      };
    }
    throw error;
  }

  return {
    riskLevel: 'medium',
    redFlags: ['Unable to fully analyze — review manually'],
    explanation: 'Analysis timed out or returned unexpected format.',
    recommendation: 'Proceed with caution. Research the client before accepting.',
  };
}
