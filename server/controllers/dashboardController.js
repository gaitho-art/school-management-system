import { pool } from '../config/db.js';

export async function getStats(req, res) {
  try {
    const [[s]] = await pool.query('SELECT COUNT(*) AS c FROM students WHERE status=\'active\'');
    const [[t]] = await pool.query('SELECT COUNT(*) AS c FROM teachers WHERE status=\'active\'');
    const [[c]] = await pool.query('SELECT COUNT(*) AS c FROM streams');
    const [[att]] = await pool.query('SELECT COUNT(*) AS c FROM attendance WHERE date = CURDATE() AND status=\'present\'');
    const [[fee]] = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM fee_payments');
    const [[exp]] = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses');
    res.json({ students: s.c, teachers: t.c, classes: c.c, present_today: att.c, fees_collected: fee.total, total_expenses: exp.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}