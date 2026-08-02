import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AddTeacher() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', qualification: '', tsc_number: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teachers', form);
      navigate('/teachers');
    } catch (err) {
      setMsg('Registration failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Register New Teacher</h1>
      {msg && <div className="p-3 bg-red-100 text-red-700 rounded">{msg}</div>}
      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input required placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input placeholder="Qualification (e.g. BEd Maths)" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input placeholder="TSC Number" value={form.tsc_number} onChange={e => setForm({...form, tsc_number: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Register Teacher</button>
      </form>
    </div>
  );
}