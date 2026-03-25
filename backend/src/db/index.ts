import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000, // 5 seconds timeout
  query_timeout: 5000, // 5 seconds query timeout
});

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS account_sessions (
        session_id TEXT PRIMARY KEY,
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        linked_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT UNIQUE NOT NULL,
        platform TEXT,
        skill TEXT,
        experience_level TEXT DEFAULT 'beginner',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        title TEXT DEFAULT 'New Conversation',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

      CREATE TABLE IF NOT EXISTS guest_usage (
        session_id TEXT PRIMARY KEY,
        user_message_count INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scam_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        pattern_type TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scam_patterns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pattern_type TEXT NOT NULL,
        pattern_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      DELETE FROM scam_patterns a
      USING scam_patterns b
      WHERE a.pattern_type = b.pattern_type
        AND a.pattern_text = b.pattern_text
        AND a.ctid > b.ctid;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_scam_patterns_unique
        ON scam_patterns(pattern_type, pattern_text);

      INSERT INTO scam_patterns (pattern_type, pattern_text)
      VALUES
        ('payment', 'Pay a registration fee / activation fee'),
        ('payment', 'Western Union / MoneyGram only'),
        ('off_platform', 'Let''s move to Telegram/WhatsApp/email before contract'),
        ('credentials', 'Send me your bank login / Upwork login'),
        ('advance_work', 'Work first, I will pay later after delivery')
      ON CONFLICT (pattern_type, pattern_text) DO NOTHING;

      CREATE TABLE IF NOT EXISTS guides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guide_type TEXT NOT NULL CHECK (guide_type IN ('payment', 'platform', 'blog')),
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content_md TEXT NOT NULL,
        last_verified DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_guides_type ON guides(guide_type);

      CREATE TABLE IF NOT EXISTS guide_translations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
        lang TEXT NOT NULL CHECK (lang IN ('en', 'am')),
        title TEXT NOT NULL,
        content_md TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (guide_id, lang)
      );

      CREATE TABLE IF NOT EXISTS guide_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        helpful BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (guide_id, session_id)
      );

      INSERT INTO guides (guide_type, slug, title, content_md, last_verified)
      VALUES
        ('payment', 'payment-matrix', 'Payment Method Matrix (Ethiopia)', $$
## What works in Ethiopia (quick matrix)

Legend: ✅ works · ⚠️ possible but tricky · ❌ not supported

| Platform | Payoneer | Direct Bank | PayPal (receive) | Wise | Grey.co |
|---|---:|---:|---:|---:|---:|
| Upwork | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Fiverr | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| PeoplePerHour | ⚠️ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Freelancer.com | ⚠️ | ⚠️ | ❌ | ⚠️ | ⚠️ |

This is a starting point. Always verify based on your account + current rules.
$$, CURRENT_DATE),

        ('payment', 'payoneer-setup', 'Payoneer Setup Guide (Ethiopia)', $$
## Payoneer setup (Ethiopia)

### Before you apply
- Use **your real name** exactly as on your ID/passport.
- Use a **reliable email** you can keep long-term.
- Prepare your **supporting documents** (passport is best).

### Common rejection reasons
- Name mismatch (profile vs document)
- Low-quality photo (glare, blur, cropped edges)
- Address inconsistency

### If you get rejected
- Fix one thing at a time, then re-submit.
- Use clear photos in daylight (no flash glare).

Next step: tell me your platform (Upwork/Fiverr/etc.) and what document you have.
$$, CURRENT_DATE),

        ('payment', 'paypal-alternatives', 'PayPal is blocked — what to do instead', $$
## PayPal in Ethiopia (honest answer)

PayPal typically **does not support receiving money** in Ethiopia. Avoid risky “workarounds” that can get you banned or scammed.

### Good alternatives
- **Payoneer** (most common)
- **Grey.co** (where available)
- **Wise** (depends on availability and account type)

### What to avoid
- Anyone asking you to “use their PayPal”
- Paying “activation fees”
- Giving access to your accounts
$$, CURRENT_DATE),

        ('payment', 'birr-conversion-calculator', 'Birr Conversion Calculator', $$
## Birr conversion calculator

Use the calculator on this page to estimate your take-home after:\n- platform fee\n- payout fee\n- ETB conversion spread\n\nAlways treat results as estimates.
$$, CURRENT_DATE),

        ('payment', 'withdrawal-comparison', 'Withdrawal Comparison (Payoneer vs alternatives)', $$
## Withdrawal comparison

Compare by:\n- fees\n- speed\n- reliability\n- proof requirements\n\nWe’ll keep this guide updated and show a “Last Verified” date.
$$, CURRENT_DATE),

        ('payment', 'upwork-id-verification', 'Upwork ID Verification (Ethiopia)', $$
## Upwork ID verification tips (Ethiopia)

Best success rate:\n- Ethiopian **passport** (clean photo, no glare)\n\nTips:\n- bright daylight\n- no reflections\n- capture all corners\n- don’t edit/beautify images
$$, CURRENT_DATE)
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO guides (guide_type, slug, title, content_md, last_verified)
      VALUES
        ('platform', 'upwork', 'Upwork Guide (with Ethiopia Section)', $$
## Overview
Upwork is a proposal-based platform. You spend **Connects** to apply. Winning early depends on profile basics + strong proposals.

## Fees (plain English)
- You pay a service fee on earnings (rules can change).
- You may also spend Connects to apply.

## Algorithm / what matters
- Relevance to the job\n- Proof (portfolio, results)\n- Responsiveness\n
## Common mistakes
- Generic proposals\n- No clear deliverables\n- Applying to bad jobs\n
## Pro tips
- Hook: mirror the job in 1–2 lines\n- Value: show the exact steps you’ll do\n- Proof: 1 link or short example\n- CTA: 1 question + suggest next step\n
## Ethiopia Section (🇪🇹)
- **PayPal receiving is blocked** in Ethiopia. Don’t plan around it.\n- **Payoneer** is the most common withdrawal route.\n- ID verification: Ethiopian **passport** tends to work best.\n
$$, CURRENT_DATE),

        ('platform', 'fiverr', 'Fiverr Guide (with Ethiopia Section)', $$
## Overview
Fiverr is gig-based. Buyers find you via search; your gig + reviews matter a lot.

## Fees (plain English)
- Fiverr takes a service fee from orders.

## What matters
- Gig keyword targeting\n- Thumbnail + gallery\n- Fast responses\n- On-time delivery\n
## Common mistakes
- Vague packages\n- No examples\n- Accepting unclear orders\n
## Pro tips
- Create 2–3 focused gigs\n- Use clear deliverables + timelines\n- Add a short FAQ\n
## Ethiopia Section (🇪🇹)
- Receiving via PayPal is not reliable for Ethiopia.\n- **Payoneer** is commonly used.\n- Watch for buyers pushing off-platform contact.\n
$$, CURRENT_DATE)
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO guides (guide_type, slug, title, content_md, last_verified)
      VALUES
        ('blog', 'payoneer-in-ethiopia', 'How to Set Up Payoneer in Ethiopia (2026)', $$
## Quick overview
If you’re in Ethiopia, **Payoneer** is the most common way to receive freelance earnings from platforms like Upwork/Fiverr.

## Checklist
- Real name matches your document\n- Clean photo of passport (best)\n- Consistent address\n
## Common rejection fixes
- Re-take photos in daylight\n- Fix name mismatch\n- Submit one change at a time\n
$$, CURRENT_DATE),
        ('blog', 'avoid-scam-clients', 'Freelance Scams Targeting Ethiopians (Red Flags)', $$
## Red flags
- Registration fee\n- Western Union\n- Off-platform pressure\n- Asking for credentials\n
## What to do
Stay on-platform. Don’t share sensitive info. Report the client.
$$, CURRENT_DATE),
        ('blog', 'best-platforms-designers-et', 'Best Platforms for Ethiopian Designers (Starter Guide)', $$
## Short answer
- Gig work: Fiverr\n- Long-term projects: Upwork\n
## Ethiopia note
Always confirm withdrawal methods before you commit.\n
$$, CURRENT_DATE),
        ('blog', 'withdraw-upwork-cbe', 'How to Withdraw Upwork Earnings to Ethiopian Banks (CBE etc.)', $$
## Reality check
Direct bank withdrawals can be tricky. Payoneer is usually simpler.\n
## Steps
1) Confirm your available withdrawal options in Upwork\n2) Choose the safest option\n3) Track fees and ETB conversion\n
$$, CURRENT_DATE),
        ('blog', 'proposal-zero-replies', 'Zero Replies on Upwork? Fix These 5 Things First', $$
## The 5 fixes
1) Target better jobs\n2) Strong first 2 lines\n3) Proof link\n4) Clear deliverables\n5) One good question\n
$$, CURRENT_DATE)
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('✅ Database migrations completed');
  } finally {
    client.release();
  }
}
