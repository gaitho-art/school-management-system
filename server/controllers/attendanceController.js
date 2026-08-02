import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getAttendance(req, res) {
  const { date, stream_id } = req.query;
  if (!date || !stream_id) return res.json([]);
  
  // Fetch students in that stream, OR students in the parent grade who haven't been assigned a stream yet
  const [rows] = await pool.query(
    `SELECT s.id, s.full_name, s.admission_number, a.status 
    FROM students s 
    LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ? 
    WHERE s.current_stream_id = ? 
       OR (s.current_stream_id IS NULL AND s.current_grade_id = (SELECT grade_id FROM streams WHERE id = ?))`,
    [date, stream_id, stream_id]
  );
  res.json(rows);
}

export async function markAttendance(req, res) {
  const { date, stream_id, records } = req.body;
  
  for (const rec of records) {
    await pool.execute(
      `INSERT INTO attendance (student_id, stream_id, date, status, recorded_by) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_by = VALUES(recorded_by)`,
      [rec.student_id, stream_id, date, rec.status, req.user.id]
    );
  }
  
  await logActivity(req.user, 'MARK_ATTENDANCE', 'attendance', 'Marked attendance for class ID: ' + stream_id);
  res.status(201).json({ message: 'Attendance saved successfully' });
}