import { pool } from '../config/db.js';

export async function assignTeacherSubject(req, res) {
  const { teacher_id, stream_id, subject_id } = req.body;
  await pool.execute(
    'INSERT INTO teacher_assignments (teacher_id, stream_id, subject_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)',
    [teacher_id, stream_id, subject_id]
  );
  res.status(201).json({ message: 'Teacher assigned to subject successfully' });
}

export async function getAssignments(req, res) {
  const [rows] = await pool.query(`
    SELECT ta.id, t.full_name as teacher_name, g.name as grade_name, s.name as stream_name, sub.name as subject_name 
    FROM teacher_assignments ta 
    JOIN teachers t ON ta.teacher_id = t.id 
    JOIN streams s ON ta.stream_id = s.id 
    JOIN grades g ON s.grade_id = g.id 
    JOIN subjects sub ON ta.subject_id = sub.id
  `);
  res.json(rows);
}