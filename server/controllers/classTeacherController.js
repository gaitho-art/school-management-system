import { pool } from '../config/db.js';

export async function assignClassTeacher(req, res) {
  const { stream_id, teacher_id, academic_year } = req.body;
  await pool.execute(
    'INSERT INTO class_teachers (stream_id, teacher_id, academic_year) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)',
    [stream_id, teacher_id, academic_year || '2025']
  );
  res.status(201).json({ message: 'Class teacher assigned successfully' });
}

export async function getClassTeachers(req, res) {
  const [rows] = await pool.query(`
    SELECT ct.id, t.full_name as teacher_name, t.teacher_number, g.name as grade_name, s.name as stream_name, ct.academic_year 
    FROM class_teachers ct 
    JOIN teachers t ON ct.teacher_id = t.id 
    JOIN streams s ON ct.stream_id = s.id 
    JOIN grades g ON s.grade_id = g.id
  `);
  res.json(rows);
}