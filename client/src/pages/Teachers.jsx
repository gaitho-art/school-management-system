import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus } from 'react-icons/fi';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [accountTeacher, setAccountTeacher] = useState(null);
  const [accountForm, setAccountForm] = useState({ username: '', password: '' });
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    api.get('/teachers').then(r => setTeachers(r.data)).catch(() => {});
  }, []);

  const createAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/teachers/${accountTeacher.id}/account`, accountForm);
      setTeachers(current => current.map(teacher => (
        teacher.id === accountTeacher.id ? { ...teacher, has_login: 1 } : teacher
      )));
      setAccountTeacher(null);
      setAccountForm({ username: '', password: '' });
      setAccountError('');
    } catch (err) {
      setAccountError(err.response?.data?.error || 'Could not create teacher account');
    }
  };

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
              <th className="p-4">Login account</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-4">{t.teacher_number}</td>
                <td className="p-4">{t.full_name}</td>
                <td className="p-4">{t.phone}</td>
                <td className="p-4">{t.email}</td>
                <td className="p-4">
                  <button onClick={() => { setAccountTeacher(t); setAccountError(''); }} className="text-blue-600 hover:underline">
                    {t.has_login ? 'Set / reset login' : 'Create login'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {accountTeacher && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={createAccount} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-xl font-semibold">Create login for {accountTeacher.full_name}</h2>
            {accountError && <p className="text-sm text-red-600">{accountError}</p>}
            <label className="block text-sm">
              Username
              <input required autoComplete="username" value={accountForm.username} onChange={e => setAccountForm({ ...accountForm, username: e.target.value })} className="mt-1 w-full rounded border px-3 py-2 dark:border-slate-600 dark:bg-slate-700" />
            </label>
            <label className="block text-sm">
              Password (at least 8 characters)
              <input required type="password" minLength={8} autoComplete="new-password" value={accountForm.password} onChange={e => setAccountForm({ ...accountForm, password: e.target.value })} className="mt-1 w-full rounded border px-3 py-2 dark:border-slate-600 dark:bg-slate-700" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setAccountTeacher(null)} className="rounded px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
              <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Create account</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}