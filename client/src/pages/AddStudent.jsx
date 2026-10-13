import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiUploadCloud } from 'react-icons/fi';

export default function AddStudent() {
  const [form, setForm] = useState({
    full_name: '',
    gender: 'Male',
    date_of_birth: '',
    current_grade_id: '',
    guardian_name: '',
    guardian_phone: '',
    medical_conditions: '',
    birth_cert_no: '',
    nationality: 'Kenyan',
    religion: '',
    photo_path: '',
    uses_transport: false,
  });
  const [grades, setGrades] = useState([]);
  const [msg, setMsg] = useState('');
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (photo) data.append('photo', photo);
      const res = await api.post('/students', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Student registered! Admission No: ' + res.data.admission_number);
      setTimeout(() => navigate('/students'), 2000);
    } catch (err) {
      setMsg('Registration failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Register New Student</h1>
      {msg && <div className="p-3 bg-blue-100 text-blue-700 rounded">{msg}</div>}
      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
            <option>Male</option>
            <option>Female</option>
          </select>
          <input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <select value={form.current_grade_id} onChange={e => setForm({...form, current_grade_id: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
            <option value="">Select Class/Grade</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input placeholder="Birth Certificate Entry Number" value={form.birth_cert_no} onChange={e => setForm({...form, birth_cert_no: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="Nationality" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="Religion" value={form.religion} onChange={e => setForm({...form, religion: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input placeholder="Guardian Name" value={form.guardian_name} onChange={e => setForm({...form, guardian_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          <input required placeholder="Guardian Phone" value={form.guardian_phone} onChange={e => setForm({...form, guardian_phone: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        </div>
        <input placeholder="Medical Conditions" value={form.medical_conditions} onChange={e => setForm({...form, medical_conditions: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-3 rounded">
          <input type="checkbox" id="uses_transport" checked={form.uses_transport} onChange={e => setForm({...form, uses_transport: e.target.checked})} className="w-5 h-5" />
          <label htmlFor="uses_transport" className="font-medium">Uses School Transport (Adds KES 5,000 to Fees)</label>
        </div>
        <label className="flex items-center gap-3 rounded border border-dashed border-slate-300 dark:border-slate-600 px-4 py-4 cursor-pointer text-sm text-slate-600 dark:text-slate-300">
          <FiUploadCloud size={18} />
          <span>{photo ? photo.name : 'Upload student passport photo or document'}</span>
          <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </label>
        
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Register Student</button>
      </form>
    </div>
  );
}