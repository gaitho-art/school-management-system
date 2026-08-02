import { pool } from '../config/db.js';

export async function getGrades(req, res) {
  const [rows] = await pool.query('SELECT id, name FROM grades ORDER BY level_order');
  res.json(rows);
}

export async function getStreams(req, res) {
  // Join with grades so we know which grade the stream belongs to
  const [rows] = await pool.query('SELECT s.id, s.name, s.grade_id, g.name as grade_name FROM streams s JOIN grades g ON s.grade_id = g.id');
  res.json(rows);
}

export async function getSubjects(req, res) {
  const [rows] = await pool.query('SELECT id, name FROM subjects');
  res.json(rows);
}