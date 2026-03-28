const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
  try {
    // 1. Update paypal-blocked
    const paypalBlockedMarkdown = `
## The Problem
PayPal does not allow receiving money directly into Ethiopian bank accounts.

## The Solution: P2P Crypto Settlement
The most efficient and widely used method for Ethiopian freelancers today is using **Peer-to-Peer (P2P)** platforms like **Bybit**, **Binance**, or **MEXC**.

1. **Earn**: Receive payments in USD on platforms like Upwork or Fiverr.
2. **Transfer**: Move the funds to a crypto exchange if supported or receive USDT directly from clients (where allowed).
3. **P2P Trade**: Sell your USDT for ETB via P2P merchants. This utilizes the market exchange rate (approx. 188 ETB/USD) rather than the much lower official bank rate.
`;
    await pool.query('UPDATE guides SET content_md = $1 WHERE slug = $2', [paypalBlockedMarkdown, 'paypal-blocked']);

    // 2. Update fiverr guide
    const fiverrMarkdown = `
## Overview
Fiverr is gig-based. Buyers find you via search; your gig + reviews matter a lot.

## Fees (plain English)
- Fiverr takes a service fee from orders.

## What matters
- Gig keyword targeting
- Thumbnail + gallery
- Fast responses
- On-time delivery

## Common mistakes
- Vague packages
- No examples
- Accepting unclear orders

## Pro tips
- Create 2–3 focused gigs
- Use clear deliverables + timelines
- Add a short FAQ

## Ethiopia Section (🇪🇹)
- Receiving via PayPal is restricted in Ethiopia.
- **P2P Trading (Bybit/Binance/MEXC)** is the most viable path to settle your earnings at the true market rate.
- Watch for buyers pushing off-platform contact or promising direct bank transfers.
`;
    await pool.query('UPDATE guides SET content_md = $1 WHERE slug = $2', [fiverrMarkdown, 'fiverr']);

    // 3. Delete old payoneer and bank guides
    await pool.query('DELETE FROM guides WHERE slug IN ($1, $2)', ['payoneer-in-ethiopia', 'withdraw-upwork-cbe']);

    console.log("Database cleanup completed successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
