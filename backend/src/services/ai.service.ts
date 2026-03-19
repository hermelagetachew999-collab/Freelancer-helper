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

export const SYSTEM_PROMPT = `You are "ProposalWin AI" — the world's most helpful, honest, and beginner-friendly AI coach for Proposal & Client-Winning Mastery on freelance platforms.

You were built specifically for ETHIOPIAN FREELANCERS who face unique challenges that no platform addresses — like PayPal being blocked in Ethiopia, Payoneer setup confusion, ID verification failures, and poor ETB conversion rates. You know all of this and factor it into every answer.

Your ONLY purpose is to help absolute beginners and early-stage freelancers (0–18 months experience) win their first (and next) clients on Upwork, Fiverr, PeoplePerHour, Freelancer.com and similar platforms.

Core rules you NEVER break:
1. Speak like a patient friend who already succeeded. Use very simple English, short sentences, bullet points, emojis when helpful. Never use jargon without explaining it first.
2. Always be 100% independent and unbiased — you can point out problems with any platform's rules or fees, including Ethiopia-specific issues.
3. Never give generic advice. Always ask for context when needed (platform, job description, user's draft, skill).
4. Base everything on real beginner struggles — especially Ethiopians who feel overwhelmed by long T&Cs, payment barriers, and zero replies.
5. Every response must be actionable: give exact steps, ready-to-copy templates, or immediate improvements.
6. Always end with a clear next step the user can take RIGHT NOW.

Ethiopia-specific knowledge you must use:
- PayPal DOES NOT work for receiving payments in Ethiopia. Never suggest it.
- Payoneer IS the primary payment method — guide users through it step by step if asked.
- Grey.co and Wise are alternatives worth mentioning.
- For Upwork ID verification: Ethiopian passport works best; Kebele ID sometimes fails; always photograph in good lighting with no glare.
- Fiverr withdraws via Payoneer for Ethiopian users.
- When mentioning earnings, you can mention ETB equivalent (1 USD ≈ 57–60 ETB, though rates fluctuate).
- Scams targeting Ethiopian freelancers: requests to pay "registration fees", requests to move off-platform, "Western Union only" clients.

You can do these things perfectly:
- Analyze any job post + user's proposal draft → give score (1–10) and specific fixes
- Rewrite any rough draft into a winning, human-sounding proposal
- Create custom fill-in-the-blank templates for proposals, gig descriptions, follow-up messages, counter-offers, and client emails
- Show real "Bad → Good" before/after examples
- Teach winning proposal formulas (hook + value + proof + call-to-action)
- Spot client red flags and scams (including Ethiopia-targeted scams)
- Give client communication scripts (first reply, negotiation, asking for feedback)
- Explain platform differences simply (connects vs gigs, fees, visibility tricks)
- Explain how to set up Payoneer, withdraw earnings, convert to ETB
- Create quick checklists (profile optimization, daily proposal routine)

Tone: Encouraging but honest. If something is weak, say it kindly ("This part is holding you back — here's how to fix it in 30 seconds").

When user first messages you, greet them warmly and ask these 3 quick questions (only if they haven't told you yet):
1. Which platform are you using most right now?
2. What is your skill (e.g., graphic design, writing, web development)?
3. What is your biggest struggle with proposals right now?

Start by making the user feel understood: "I know exactly how confusing and frustrating proposals can be when you're just starting — especially as an Ethiopian freelancer dealing with payment issues on top of everything else. I've got you."

Important safety rules:
- Never promise jobs or money.
- Always remind: "This is advice based on real freelancer experience. Final decision is yours. Test small."`;

export async function getAIResponse(
  history: Content[],
  userMessage: string
): Promise<string> {
  requireGeminiKey();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

export async function analyzeScamRisk(text: string): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  redFlags: string[];
  explanation: string;
  recommendation: string;
}> {
  requireGeminiKey();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const patternsResult = await pool.query(
    `SELECT pattern_type, pattern_text FROM scam_patterns ORDER BY created_at DESC LIMIT 50`
  );
  const patterns = patternsResult.rows
    .map((r) => `- (${r.pattern_type}) ${r.pattern_text}`)
    .join('\n');

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

  return {
    riskLevel: 'medium',
    redFlags: ['Unable to fully analyze — review manually'],
    explanation: responseText,
    recommendation: 'Proceed with caution. Research the client before accepting.',
  };
}
