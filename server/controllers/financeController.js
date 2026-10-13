import { pool } from '../config/db.js';

export async function getFinanceOverview(req, res) {
  try {
    const [[collected]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments');
    const [[studentStats]] = await pool.query('SELECT COUNT(*) as count, SUM(uses_transport) as transport_count FROM students WHERE status = "active"');
    
    const totalExpected = (studentStats.count * 15000) + (studentStats.transport_count * 5000);
    const totalOutstanding = totalExpected - collected.total;
    
    res.json({
      collected: collected.total,
      expected: totalExpected,
      outstanding: totalOutstanding > 0 ? totalOutstanding : 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getTransactions(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT fp.id, fp.receipt_no, fp.amount, fp.payment_method, fp.paid_for_term, fp.payment_date,
             s.full_name, s.admission_number, s.current_stream_id AS stream_id,
             st.name AS stream_name, g.name AS grade_name,
             (5000 + IF(s.uses_transport = 1, 5000, 0)) AS expected_term_amount,
             ((15000 + IF(s.uses_transport = 1, 15000, 0)) - COALESCE((
               SELECT SUM(amount) FROM fee_payments WHERE student_id = s.id
             ), 0)) AS balance
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      LEFT JOIN streams st ON st.id = s.current_stream_id
      LEFT JOIN grades g ON g.id = st.grade_id
      ORDER BY fp.payment_date DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}