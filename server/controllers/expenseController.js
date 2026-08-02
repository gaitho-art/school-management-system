import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getExpenses(req, res) {
  const [rows] = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
  res.json(rows);
}

export async function addExpense(req, res) {
  const { description, amount, category } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)',
    [description, amount, category || 'General']
  );
  await logActivity(req.user, 'ADD_EXPENSE', 'finance', 'Recorded expense: ' + description);
  res.status(201).json({ id: result.insertId, message: 'Expense recorded successfully' });
}

export async function deleteExpense(req, res) {
  await pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
  res.json({ message: 'Expense deleted' });
}