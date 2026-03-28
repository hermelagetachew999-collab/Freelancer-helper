import { pool } from './src/db/index';

async function check() {
  try {
    const res = await pool.query('SELECT guide_type, count(*) FROM guides GROUP BY guide_type');
    console.log('Row counts:', res.rows);
    const slugs = await pool.query('SELECT slug FROM guides');
    console.log('Slugs:', slugs.rows.map(r => r.slug));
  } catch (e) {
    console.error('Check failed:', e);
  } finally {
    process.exit();
  }
}

check();
