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

export async function getAttendanceReport(req, res) {
  const { stream_id, period, date } = req.query;
  if (!stream_id) return res.json([]);

  const selectedDate = date || new Date().toISOString().slice(0, 10);
  const [year, month] = selectedDate.split('-').map(Number);
  let startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  let endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

  if (period === 'term') {
    const termStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
    const start = new Date(year, termStartMonth - 1, 1);
    const end = new Date(year, termStartMonth + 2, 0);
    startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
    endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  }

  try {
    const [rows] = await pool.query(
      `SELECT s.id AS student_id, s.full_name AS student_name, s.admission_number,
              a.date, a.status
       FROM students s
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date BETWEEN ? AND ?
       WHERE s.current_stream_id = ?
          OR (s.current_stream_id IS NULL AND s.current_grade_id = (SELECT grade_id FROM streams WHERE id = ?))
       ORDER BY s.id, a.date`,
      [startDate, endDate, stream_id, stream_id]
    );

    const grouped = {};
    rows.forEach((row) => {
      if (!grouped[row.student_id]) {
        grouped[row.student_id] = {
          student_id: row.student_id,
          student_name: row.student_name,
          admission_number: row.admission_number,
          records: []
        };
      }
      if (row.date) {
        grouped[row.student_id].records.push({ date: row.date, status: row.status });
      }
    });

    res.json(Object.values(grouped));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}