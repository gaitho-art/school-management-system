import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getItems(req, res) {
  const [rows] = await pool.query('SELECT * FROM inventory_items ORDER BY name ASC');
  res.json(rows);
}

export async function addItem(req, res) {
  const { name, category, quantity, unit, unit_cost, condition_status } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO inventory_items (name, category, quantity, unit, unit_cost, condition_status) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category || 'General', quantity || 0, unit || 'pcs', unit_cost || 0, condition_status || 'good']
  );
  await logActivity(req.user, 'ADD_INVENTORY', 'inventory', 'Added item: ' + name);
  res.status(201).json({ id: result.insertId, message: 'Item added successfully' });
}

export async function updateItem(req, res) {
  const { name, category, quantity, unit, unit_cost, condition_status } = req.body;
  await pool.execute(
    'UPDATE inventory_items SET name = ?, category = ?, quantity = ?, unit = ?, unit_cost = ?, condition_status = ? WHERE id = ?',
    [name, category, quantity, unit, unit_cost, condition_status, req.params.id]
  );
  res.json({ message: 'Item updated successfully' });
}

export async function deleteItem(req, res) {
  await pool.execute('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
  res.json({ message: 'Item deleted' });
}