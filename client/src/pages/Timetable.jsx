import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiAlertCircle } from 'react-icons/fi';

export default function Timetable() {
  const [entries, setEntries] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filterStream, setFilterStream] = useState('');
  const [form, setForm] = useState({ day_of_week: 'Mon', period: 1, start_time: '08:00', end_time: '08:40', subject_id: '', teacher_id: '', room: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = () => {
    if (!filterStream) return;
    api.get('/timetable?stream_id=' + filterStream).then(r => setEntries(r.data));
  };

  useEffect(() => {
    api.get('/streams').then(r => setStreams(r.data));
    api.get('/subjects').then(r => setSubjects(r.data));
    api.get('/teachers').then(r => setTeachers(r.data));
  }, []);

  useEffect(() => {
    loadData();
  }, [filterStream]);

  const addEntry = async (e) => {
    e.preventDefault();
    if (!filterStream) return alert('Please select a class first.');
    setError(''); setSuccess('');
    try {
      const payload = { ...form, stream_id: filterStream };
      const res = await api.post('/timetable', payload);
      setSuccess(res.data.message);
      setForm({ day_of_week: 'Mon', period: 1, start_time: '08:00', end_time: '08:40', subject_id: '', teacher_id: '', room: '' });
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add entry');
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const grid = {};
  days.forEach(d => grid[d] = {});
  entries.forEach(e => {
    grid[e.day_of_week][e.period] = e;
  });

  const selectedStreamObj = streams.find(s => s.id == filterStream);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Weekly Timetable</h1>
        <select value={filterStream} onChange={e => setFilterStream(e.target.value)} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64">
          <option value="">Select Class to View/Edit</option>
          {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
        </select>
      </div>
      
      {!filterStream ? (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-soft text-center text-slate-500">
          Please select a class from the dropdown above to view or edit its specific timetable.
        </div>
      ) : (
        <>
          {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2"><FiAlertCircle /> {error}</div>}
          {success && <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-xl">{success}</div>}

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Add Lesson for {selectedStreamObj?.grade_name} - {selectedStreamObj?.name}</h3>
            <form onSubmit={addEntry} className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
              <div>
                <label className="text-xs block mb-1 text-slate-600 dark:text-slate-300">Day</label>
                <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} className="w-full px-2 py-2 text-sm border rounded-lg dark:bg-slate-700">
                  {days.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1 text-slate-600 dark:text-slate-300">Period</label>
                <input type="number" min="1" max="8" value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="w-full px-2 py-2 text-sm border rounded-lg dark:bg-slate-700" />
              </div>
              <div>
                <label className="text-xs block mb-1 text-slate-600 dark:text-slate-300">Subject</label>
                <select value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} className="w-full px-2 py-2 text-sm border rounded-lg dark:bg-slate-700">
                  <option value="">N/A</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 md:col-span-2">
                <label className="text-xs block mb-1 text-slate-600 dark:text-slate-300">Teacher</label>
                <select value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})} className="w-full px-2 py-2 text-sm border rounded-lg dark:bg-slate-700">
                  <option value="">N/A</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1 text-slate-600 dark:text-slate-300">Room</label>
                <input value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full px-2 py-2 text-sm border rounded-lg dark:bg-slate-700" />
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700">Add</button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft overflow-x-auto">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">
              Schedule for {selectedStreamObj?.grade_name} - {selectedStreamObj?.name}
            </h3>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-3 border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 w-24">Period</th>
                  {days.map(d => (
                    <th key={d} className="p-3 border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-center">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map(p => (
                  <tr key={p}>
                    <td className="p-3 border dark:border-slate-600 font-bold text-center bg-slate-50 dark:bg-slate-700">{p}</td>
                    {days.map(d => {
                      const lesson = grid[d]?.[p];
                      return (
                        <td key={d} className="p-2 border dark:border-slate-600 align-top w-48">
                          {lesson ? (
                            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg text-center h-full">
                              <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">{lesson.subject_name || 'N/A'}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{lesson.teacher_name || 'N/A'}</div>
                              <div className="text-xs text-slate-500 mt-1">{lesson.start_time} - {lesson.end_time}</div>
                              {lesson.room && <div className="text-xs text-slate-500">Room: {lesson.room}</div>}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs">Free</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}