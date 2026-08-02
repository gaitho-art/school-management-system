import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Attendance() {
  const [streams, setStreams] = useState([]);
  const [selStream, setSelStream] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/streams').then(r => setStreams(r.data)).catch(() => {});
  }, []);

  const loadAttendance = () => {
    if (!selStream || !date) return;
    setLoading(true);
    api.get(`/attendance?stream_id=${selStream}&date=${date}`).then(r => {
      setStudents(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleStreamChange = (e) => {
    setSelStream(e.target.value);
  };

  const setStatus = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  const saveAttendance = async () => {
    const records = students.map(s => ({ student_id: s.id, status: s.status || 'absent' }));
    await api.post('/attendance/mark', { date, stream_id: selStream, records });
    alert('Attendance saved successfully!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance Register</h1>
      
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Select Class</label>
          <select value={selStream} onChange={handleStreamChange} className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Select Class...</option>
            {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-64">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={loadAttendance} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
          Load Register
        </button>
      </div>

      {students.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Mark Attendance</h2>
            <button onClick={saveAttendance} className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700">Save Attendance</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
              <tr>
                <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Adm No</th>
                <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                <th className="p-5 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b dark:border-slate-700">
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.admission_number}</td>
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{s.full_name}</td>
                  <td className="p-5 text-center">
                    <div className="inline-flex rounded-xl overflow-hidden border dark:border-slate-600">
                      <button 
                        onClick={() => setStatus(s.id, 'present')} 
                        className={`px-4 py-2 text-sm font-medium ${
                          s.status === 'present' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => setStatus(s.id, 'absent')} 
                        className={`px-4 py-2 text-sm font-medium ${
                          s.status === 'absent' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {students.length === 0 && !loading && selStream && (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-soft text-center text-slate-500">
          Click "Load Register" to view students for this class.
        </div>
      )}
    </div>
  );
}