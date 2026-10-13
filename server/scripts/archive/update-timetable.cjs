const fs = require('fs');

const content = `import { pool } from '../config/db.js';

export async function getTimetable(req, res) {
  const streamId = req.query.stream_id;
  let query = \`
    SELECT t.id, t.day_of_week, t.period, t.start_time, t.end_time, 
           g.name as grade_name, s.name as stream_name, 
           sub.name as subject_name, t.room,
           tc.full_name as teacher_name
    FROM timetable t
    JOIN streams s ON t.stream_id = s.id
    JOIN grades g ON s.grade_id = g.id
    LEFT JOIN subjects sub ON t.subject_id = sub.id
    LEFT JOIN teachers tc ON t.teacher_id = tc.id
  \`;
  const params = [];
  if (streamId) {
    query += ' WHERE t.stream_id = ?';
    params.push(streamId);
  }
  query += ' ORDER BY FIELD(t.day_of_week, "Mon", "Tue", "Wed", "Thu", "Fri"), t.period ASC';
  
  const [rows] = await pool.query(query, params);
  res.json(rows);
}

export async function addTimetableEntry(req, res) {
  const { stream_id, day_of_week, period, start_time, end_time, subject_id, teacher_id, room } = req.body;
  
  // 1. Check for Teacher Conflict
  if (teacher_id) {
    const [conflicts] = await pool.query(
      'SELECT t.id, s.name as stream_name, g.name as grade_name FROM timetable t JOIN streams s ON t.stream_id = s.id JOIN grades g ON s.grade_id = g.id WHERE t.teacher_id = ? AND t.day_of_week = ? AND t.period = ?',
      [teacher_id, day_of_week, period]
    );
    if (conflicts.length > 0) {
      return res.status(400).json({ error: \`Conflict! This teacher is already teaching \${conflicts[0].grade_name} - \${conflicts[0].stream_name} at this time.\` });
    }
  }
  
  // 2. Check for Class/Room Conflict (Optional but good practice)
  const [classConflict] = await pool.query(
    'SELECT id FROM timetable WHERE stream_id = ? AND day_of_week = ? AND period = ?',
    [stream_id, day_of_week, period]
  );
  if (classConflict.length > 0) {
    return res.status(400).json({ error: 'Conflict! This class already has a lesson scheduled at this time.' });
  }

  try {
    await pool.execute(
      'INSERT INTO timetable (stream_id, day_of_week, period, start_time, end_time, subject_id, teacher_id, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [stream_id, day_of_week, period, start_time, end_time, subject_id || null, teacher_id || null, room || null]
    );
    res.status(201).json({ message: 'Timetable entry added successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}`;

fs.writeFileSync('controllers/timetableController.js', content);
console.log('Timetable backend updated successfully!');