import { pool } from '../config/db.js';

export async function getExamsList(req, res) {
  const [rows] = await pool.query('SELECT id, name, term, academic_year FROM exams ORDER BY academic_year DESC, term ASC');
  res.json(rows);
}

export async function getExamRankings(req, res) {
  const examId = req.params.examId;
  const gradeId = req.query.grade_id;
  const streamId = req.query.stream_id;
  
  let query = `
    SELECT s.id, s.admission_number, s.full_name, g.name as grade_name, st.name as stream_name, 
           SUM(er.marks) as total_marks, 
           AVG(er.marks) as average_marks,
           COUNT(er.id) as subjects_taken
    FROM students s
    JOIN exam_results er ON s.id = er.student_id
    LEFT JOIN grades g ON s.current_grade_id = g.id
    LEFT JOIN streams st ON s.current_stream_id = st.id
    WHERE er.exam_id = ? ${gradeId ? 'AND s.current_grade_id = ?' : ''} ${streamId ? 'AND s.current_stream_id = ?' : ''}
    GROUP BY s.id
    ORDER BY total_marks DESC
  `;
  
  const params = [examId];
  if (gradeId) params.push(gradeId);
  if (streamId) params.push(streamId);
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}