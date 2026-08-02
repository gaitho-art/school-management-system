import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus } from 'react-icons/fi';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    api.get('/teachers').then(r => setTeachers(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <Link to="/teachers/add" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <FiPlus /> Register Teacher
        </Link>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Teacher No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Email</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-4">{t.teacher_number}</td>
                <td className="p-4">{t.full_name}</td>
                <td className="p-4">{t.phone}</td>
                <td className="p-4">{t.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}