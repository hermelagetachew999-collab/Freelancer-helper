import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const TOKEN = 'change_me_to_a_long_random_admin_token';

async function test() {
  console.log('Testing /admin/content...');
  try {
    const res1 = await axios.get(`${API_BASE}/admin/content`, {
      headers: { 'x-admin-token': TOKEN }
    });
    console.log('Content success:', res1.status, res1.data.length, 'items');
  } catch (e: any) {
    console.log('Content failed:', e.response?.status, e.response?.data);
  }

  console.log('\nTesting /admin/scam-reports...');
  try {
    const res2 = await axios.get(`${API_BASE}/admin/scam-reports`, {
      headers: { 'x-admin-token': TOKEN }
    });
    console.log('Reports success:', res2.status, res2.data.length, 'items');
  } catch (e: any) {
    console.log('Reports failed:', e.response?.status, e.response?.data);
  }
}

test();
