import { pool } from '../config/db.js';

export async function logActivity(user, action, module, detail = '') {
  try {
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action, module, detail, ip_address)
       VALUES (:uid, :a, :m, :d, :ip)`,
      { uid: user?.id || null, a: action, m: module, d: detail, ip: '' }
    );
  } catch (e) { console.warn('log fail', e.message); }
}