import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Exams() {
  const [rankings, setRankings] = useState([]);
  const [grades, setGrades] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [selGrade, setSelGrade] = useState('');
  const [selExam, setSelExam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
    api.get('/exams/list').then(r => {
      setExamsList(r.data);
      if (r.data.length > 0) setSelExam(r.data[0].id);
    }).catch(() => {});
  }, []);

  const loadRankings = (examId, gradeId) => {
    if (!examId) return;
    setLoading(true);
    let url = `/exams/rankings/${examId}`;
    if (gradeId) url += `?grade_id=${gradeId}`;
    api.get(url).then(r => {
      setRankings(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadRankings(selExam, selGrade);
  }, [selExam, selGrade]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exam Rankings</h1>
        <div className="flex gap-3">
          <select value={selExam} onChange={e => setSelExam(e.target.value)} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
            {examsList.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.academic_year})</option>)}
          </select>
          <select value={selGrade} onChange={e => setSelGrade(e.target.value)} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Grades</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <tr>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Position</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Admission No</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Class</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Subjects</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Total Marks</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Average</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b dark:border-slate-700">
                  <td className="p-5"><div className="skeleton h-4 w-8"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-24"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-40"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-20"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-12"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                </tr>
              ))
            ) : (
              rankings.map((s, index) => (
                <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-5 font-bold text-slate-800 dark:text-slate-100">{index + 1}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.admission_number}</td>
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{s.full_name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.grade_name} {s.stream_name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.subjects_taken}</td>
                  <td className="p-5 font-mono font-bold text-blue-600 dark:text-blue-400">{s.total_marks}</td>
                  <td className="p-5 font-mono text-slate-700 dark:text-slate-300">{Number(s.average_marks).toFixed(1)}</td>
                </tr>
              ))
            )}
            {!loading && rankings.length === 0 && (
              <tr><td colSpan="7" className="p-10 text-center text-slate-500">No exam marks recorded for this selection yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}