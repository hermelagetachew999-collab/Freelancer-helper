import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS first_name TEXT;
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_name TEXT;

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
        ('payment', 'P2P payment without platform escrow release'),
        ('payment', 'Sending crypto to "support" for verification'),
        ('off_platform', 'Let''s move to Telegram/WhatsApp/email before contract'),
        ('credentials', 'Send me your exchange login / API keys'),
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

      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes(email);

      INSERT INTO guides (guide_type, slug, title, content_md, last_verified)
      VALUES
        ('payment', 'p2p-usd-guide', 'Buying USD via P2P (Bybit/Binance/MEXC)', $$
## Buying USD via P2P
For freelancers in Ethiopia, Peer-to-Peer (P2P) trading on platforms like **Bybit**, **Binance**, or **MEXC** is an efficient way to acquire USD for business expenses.

### Steps:
1. **Verify Identity**: Complete KYC on the exchange.
2. **Select P2P**: Choose "Buy" and select "USD" (or USDT).
3. **Filter Payment**: Select local payment methods compatible with your bank.
4. **Choose Merchant**: Select sellers with high completion rates (95%+).
5. **Release**: Follow the escrow instructions carefully.

*Tip: Always use the platform's internal chat for communication.*
$$, CURRENT_DATE),

        ('payment', 'virtual-visa-bybit', 'How to get a Virtual VISA Card on Bybit', $$
## Virtual VISA Card (Bybit)
A virtual VISA card allows you to pay for international services like Upwork Connects or online subscriptions directly.

### How to obtain:
1. Navigate to the **Bybit Card** section in the app.
2. Apply for the virtual version (requires identity verification).
3. Top up your card using your USDT/USD balance from P2P.
4. Access card details (number, CVV) for online transactions.
$$, CURRENT_DATE),

        ('platform', 'upwork-connects', 'Upwork Connects: Buying and Strategic Use', $$
## Managing Upwork Connects
Connects are your "currency" to apply for jobs. Use them wisely to maintain a high ROI.

### Buying Connects:
- Use a virtual VISA card (like Bybit's) if local cards are restricted.
- Go to **Settings > Billing & Payments** to add your card.
- Purchase bundles to save on transaction frequency.

### Strategic Use:
- **Avoid Crowded Jobs**: Don't waste connects on jobs with 50+ applications unless you are a perfect match.
- **Boost Strategically**: Only boost your proposal if you are in the top 3 specialized matches.
- **Target Recently Posted**: Apply to jobs posted within the last 1–2 hours.
$$, CURRENT_DATE),

        ('blog', 'professional-proposals', 'Strategic Proposal Writing: Hook, Value, CTA', $$
## Writing Professional Proposals
A winning proposal is concise, client-focused, and professional.

### Structure:
1. **The Hook**: Address the client's specific problem in the first 2 lines.
2. **The Value**: Explain *how* you will solve it, mentioning similar past success.
3. **The Proof**: Provide one specific link or attachment relevant to the task.
4. **The CTA**: End with a question or a suggestion for a brief discovery call.

*Example: "I noticed your site has a slow checkout flow. I recently optimized a similar React app, reducing drop-off by 20%..."*
$$, CURRENT_DATE),

        ('blog', 'pricing-by-experience', 'Managing Prices Based on Experience Tiers', $$
## Pricing Strategies
Adjust your rates as your expertise and "Social Proof" (reviews) grow.

### Experience Tiers:
- **Beginner ($10–$20/hr)**: Focus on building your portfolio and acquisition of 5-star reviews.
- **Intermediate ($25–$50/hr)**: Specialize in a niche. Leverage your proven track record.
- **Expert ($60+/hr)**: Focus on high-value consulting and complex problem-solving.

*Tip: Research "Market Rates" for your specific skill on Upwork to stay competitive.*
$$, CURRENT_DATE),

        ('platform', 'fiverr-gigs-niche', 'Fiverr: Gig Creation and Niche Selection', $$
## Fiverr Success
Success on Fiverr requires high visibility and a clear "Niche" (specialization).

### Gig Checklist:
- **Niche Down**: Instead of "Graphic Design," try "Logo Design for Organic Skincare Brands."
- **Visuals**: Use high-quality, professional thumbnails.
- **Packages**: Offer three tiers (Basic, Standard, Premium) with clear deliverables.
- **SEO**: Use 5 relevant tags and include keywords in your title.
$$, CURRENT_DATE),

        ('platform', 'other-platforms', 'Other Platforms: PeoplePerHour and Beyond', $$
## Expanding Your Reach
Don't rely on a single platform. Explore others to find your best fit.

### Alternatives:
- **PeoplePerHour**: Great for European clients and fixed-price projects.
- **Freelancer.com**: High volume of technical and data-entry work.
- **Contra**: A modern platform focused on high-end creative portfolios.
$$, CURRENT_DATE)
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('✅ Database migrations completed');
  } finally {
    client.release();
  }
}
