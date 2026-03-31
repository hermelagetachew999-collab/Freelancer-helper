import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import Bottleneck from 'bottleneck';
import { pool } from '../db/index';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- RATE LIMITER CONFIG ---
// Free tier allows ~15 RPM for 2.0-Flash-Lite. 
// We use 1 concurrent request and 4s spacing to be extremely safe.
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 4000, 
});

console.log('🤖 AI Service: Gemini Key Present:', !!process.env.GEMINI_API_KEY);

const DEFAULT_MODEL = 'gemini-2.0-flash-lite';

export const SYSTEM_PROMPT = `You are "Freelancer-Helper AI" — a professional coach for Proposal & Client-Winning Mastery on freelance platforms, specialized in the Ethiopian market. Your mission is to help freelancers (from beginners to advanced) win more jobs by providing actionable coaching, analyzing their proposals, and offering localized strategies for payment settlement (P2P on Binance/Bybit/MEXC) and market-aware ETB conversion.

CORE CAPABILITIES:
- Proposal Rewriting & Optimization.
- Platform-specific strategy (Upwork, Freelancer, Fiverr).
- Pricing & Financial Guidance (Fixed vs Hourly, P2P ETB/USD).
- Market Analysis & Skill-gap identification.

TONE:
Professional, encouraging, authoritative yet accessible, and deeply practical.

LOCALIZED CONTEXT (ETHIOPIA):
- Support users in navigating USD to ETB conversion via P2P (Market rate: ~188 ETB).
- Warn against scams targeting Ethiopian freelancers (e.g., direct bank transfers from unknown clients).
- Promote P2P settlement on reputable exchanges over deprecated methods.

Always prioritize practical "wins" for the freelancer. Keep responses concise unless a deep analysis is requested.`;

// Helper to get a model with the latest API key
function getModel(options?: { model?: string; systemInstruction?: string }) {
  const key = process.env.GEMINI_API_KEY || 'no_key_provided';
  const api = new GoogleGenerativeAI(key);
  // Using gemini-2.0-flash-lite as fallback for stability
  return api.getGenerativeModel({
    model: options?.model || DEFAULT_MODEL,
    systemInstruction: options?.systemInstruction,
  });
}

/**
 * Core AI Response function with Retry Logic and Rate Limiting
 */
export async function getAIResponse(
  history: Content[],
  userMessage: string,
  retries = 3
): Promise<string> {
  // Wrap the call in the bottleneck limiter
  return limiter.schedule(async () => {
    let attempt = 0;
    
    while (attempt <= retries) {
      try {
        const key = process.env.GEMINI_API_KEY;
        if (!key || key === 'your_gemini_api_key_here') {
          console.warn('⚠️ Gemini Key is missing, using mock response.');
          return `Your proposal looks promising! As a professional coach, I've analyzed your input. (Note: This is a simulated response because a live Gemini API key is missing).`;
        }

        const model = getModel({ systemInstruction: SYSTEM_PROMPT });
        const chat = model.startChat({ history });

        console.log(`📡 [Attempt ${attempt + 1}/${retries + 1}] Sending message to Gemini API (${DEFAULT_MODEL})...`);
        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();
        console.log(`📥 Gemini response successfully generated.`);
        return responseText;

      } catch (error: any) {
        attempt++;
        const isRateLimit = error.status === 429 || error.message?.includes('429');
        
        if (isRateLimit && attempt <= retries) {
          // Parse retry delay from errorDetails if available
          let waitMs = 30000; // Default 30s
          
          if (error.errorDetails) {
            const retryInfo = error.errorDetails.find((d: any) => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
              // Convert "40s" or "40.5s" to ms
              waitMs = parseFloat(retryInfo.retryDelay) * 1000 || 30000;
            }
          }

          console.warn(`⚠️ Gemini Rate Limit Hit (429). Retrying in ${waitMs / 1000}s... (Attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }

        // Handle specific API errors
        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('key not valid')) {
          console.error('❌ AI Error: Invalid API Key');
          return `[API KEY ERROR] Your Gemini API key is invalid. Please check your backend/.env file.`;
        }

        // Final failure
        if (attempt > retries) {
          console.error('❌ AI Service failed after max retries:', error.message || error);
          return `[SYSTEM BUSY] The AI is currently receiving too many requests. Please try again in about a minute.`;
        }

        // For other unexpected errors, re-throw to be caught by route handler
        throw error;
      }
    }
    return "[ERROR] System reached an unreachable state in AI service.";
  });
}

/**
 * Scam analysis logic (using the same pattern)
 */
export async function analyzeScamRisk(text: string): Promise<any> {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'your_gemini_api_key_here') {
      return {
        riskLevel: 'medium',
        redFlags: ['[MOCK] No valid API Key found'],
        explanation: 'Configure your GEMINI_API_KEY in the backend/.env file to enable real-time detection.',
        recommendation: 'Use manual judgment for now.',
      };
    }

    return limiter.schedule(async () => {
      try {
        let patterns = '- (none yet available)';
        const isDbConnected = await pool.query('SELECT 1').then(() => true).catch(() => false);
        if (isDbConnected) {
          const patternsResult = await pool.query(
            `SELECT pattern_type, pattern_text FROM scam_patterns ORDER BY created_at DESC LIMIT 50`
          );
          patterns = patternsResult.rows
            .map((r: any) => `- (${r.pattern_type}) ${r.pattern_text}`)
            .join('\n');
        }

        const prompt = `Analyze this job post or client message for scam risk:
"""
${text}
"""

Known scam patterns:
${patterns}

Return JSON with format:
{
  "riskLevel": "low|medium|high",
  "redFlags": ["flag1", ...],
  "explanation": "why",
  "recommendation": "do what"
}`;

        const model = getModel();
        console.log(`📡 Analyzing scam risk...`);
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        
        const cleanJson = content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (error) {
        console.error('Scam analysis failed:', error);
        return {
          riskLevel: 'medium',
          redFlags: ['Error analyzing text'],
          explanation: 'The AI service encountered an error during scam analysis.',
          recommendation: 'Use caution and manual judgment.'
        };
      }
    });
}
