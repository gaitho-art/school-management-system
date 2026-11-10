import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiUploadCloud } from 'react-icons/fi';

export default function AddTeacher() {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    qualification: '',
    tsc_number: '',
    national_id: '',
    tax_pin: '',
    nssf_number: '',
    sha_number: '',
    address: '',
    employment_date: '',
  });
  const [msg, setMsg] = useState('');
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (photo) data.append('photo', photo);
      await api.post('/teachers', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/teachers');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Register New Teacher</h1>
      {msg && <div className="p-3 bg-red-100 text-red-700 rounded">{msg}</div>}
      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input required placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input required autoComplete="username" placeholder="Login username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input required type="password" minLength={8} autoComplete="new-password" placeholder="Login password (at least 8 characters)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="Qualification (e.g. BEd Maths)" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="TSC Number" value={form.tsc_number} onChange={e => setForm({...form, tsc_number: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="ID Number" value={form.national_id} onChange={e => setForm({...form, national_id: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="Tax PIN" value={form.tax_pin} onChange={e => setForm({...form, tax_pin: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="NSSF Number" value={form.nssf_number} onChange={e => setForm({...form, nssf_number: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="SHA Number" value={form.sha_number} onChange={e => setForm({...form, sha_number: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input type="date" value={form.employment_date} onChange={e => setForm({...form, employment_date: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        </div>
        <textarea placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" rows="3" />
        <label className="flex items-center gap-3 rounded border border-dashed border-slate-300 dark:border-slate-600 px-4 py-4 cursor-pointer text-sm text-slate-600 dark:text-slate-300">
          <FiUploadCloud size={18} />
          <span>{photo ? photo.name : 'Upload teacher passport photo or document'}</span>
          <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </label>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Create Teacher Account</button>
      </form>
    </div>
  );
}