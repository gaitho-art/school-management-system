import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Classes() {
  const [streams, setStreams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [selStream, setSelStream] = useState('');
  const [selTeacher, setSelTeacher] = useState('');
  const [selSubject, setSelSubject] = useState('');

  const loadData = () => {
    api.get('/streams').then(r => setStreams(r.data));
    api.get('/teachers').then(r => setTeachers(r.data));
    api.get('/subjects').then(r => setSubjects(r.data));
    api.get('/assignments').then(r => setAssignments(r.data));
  };

  useEffect(() => { loadData(); }, []);

  const assign = async (e) => {
    e.preventDefault();
    if (!selStream || !selTeacher || !selSubject) return alert('Please select class, teacher, and subject');
    await api.post('/assignments', { stream_id: selStream, teacher_id: selTeacher, subject_id: selSubject });
    setSelStream(''); setSelTeacher(''); setSelSubject('');
    loadData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Class & Subject Management</h1>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">Assign Teacher to Subject & Class</h3>
        <form onSubmit={assign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm block mb-1">Class</label>
            <select value={selStream} onChange={e => setSelStream(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select...</option>
              {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Teacher</label>
            <select value={selTeacher} onChange={e => setSelTeacher(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Subject</label>
            <select value={selSubject} onChange={e => setSelSubject(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Assign</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">Current Teacher Assignments</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Class</th>
              <th className="p-4">Teacher</th>
              <th className="p-4">Subject</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="border-b dark:border-slate-700">
                <td className="p-4">{a.grade_name} - {a.stream_name}</td>
                <td className="p-4">{a.teacher_name}</td>
                <td className="p-4">{a.subject_name}</td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr><td colSpan="3" className="p-4 text-center text-slate-500">No assignments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}