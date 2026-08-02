import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Transport() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students').then(r => {
      setStudents(r.data.filter(s => s.uses_transport === 1));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transport Module</h1>
      <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl text-blue-700 dark:text-blue-400">
        Transport is charged at KES 5,000 separately from school fees. You can record transport payments from a student's profile.
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <tr>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Admission No</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Class</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Transport Charge</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Transport Paid</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Transport Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-10 text-center text-slate-500">Loading transport list...</td></tr>
            ) : (
              students.map(s => (
                <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.admission_number}</td>
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{s.full_name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.grade_name || 'Unassigned'}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">KES 5,000</td>
                  <td className="p-5 font-mono text-green-600">KES {Number(s.transport_paid).toLocaleString()}</td>
                  <td className="p-5 font-mono font-bold text-red-500">KES {Number(s.transport_balance).toLocaleString()}</td>
                </tr>
              ))
            )}
            {!loading && students.length === 0 && (
              <tr><td colSpan="6" className="p-10 text-center text-slate-500">No students are registered for transport yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}