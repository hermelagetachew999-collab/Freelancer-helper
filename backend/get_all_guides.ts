import { pool } from './src/db/index';

async function run() {
  const res = await pool.query('SELECT id, slug, title, content_md FROM guides');
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}

run();
