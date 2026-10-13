const fs = require('fs');
const path = require('path');

const files = {
  'src/pages/AddStudent.jsx': `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AddStudent() {
  const [form, setForm] = useState({ full_name: '', gender: 'Male', date_of_birth: '', current_grade_id: '', guardian_name: '', guardian_phone: '', medical_conditions: '' });
  const [grades, setGrades] = useState([]);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', form);
      setMsg('Student registered! Admission No: ' + res.data.admission_number);
      setTimeout(() => navigate('/students'), 2000);
    } catch (err) {
      setMsg('Registration failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Register New Student</h1>
      {msg && <div className="p-3 bg-blue-100 text-blue-700 rounded">{msg}</div>}
      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
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
        <input placeholder="Guardian Name" value={form.guardian_name} onChange={e => setForm({...form, guardian_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input required placeholder="Guardian Phone" value={form.guardian_phone} onChange={e => setForm({...form, guardian_phone: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input placeholder="Medical Conditions" value={form.medical_conditions} onChange={e => setForm({...form, medical_conditions: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Register Student</button>
      </form>
    </div>
  );
}`,
  'src/pages/StudentProfile.jsx': `import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('1');
  const [marks, setMarks] = useState('');

  const loadStudent = () => api.get(\`/students/\${id}\`).then(r => setStudent(r.data));

  useEffect(() => { loadStudent(); }, []);

  const payFee = async (e) => {
    e.preventDefault();
    await api.post('/fees/payment', { student_id: id, amount: Number(amount), payment_method: 'cash', paid_for_term: Number(term) });
    setAmount('');
    loadStudent();
  };

  const addExam = async (e) => {
    e.preventDefault();
    // Hardcoded exam_id=1, subject_id=1 for simplicity in this demo
    await api.post('/exams/results', { student_id: id, exam_id: 1, subject_id: 1, marks: Number(marks), grade: 'A' });
    setMarks('');
    loadStudent();
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <p className="text-slate-500">Adm: {student.admission_number} | Class: {student.grade_name || 'Unassigned'} | Guardian: {student.guardian_name} ({student.guardian_phone})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-100 dark:bg-red-900/30 p-5 rounded-xl shadow text-red-700 dark:text-red-400">
          <div className="text-sm">Total Billed</div>
          <div className="text-2xl font-bold">KES {student.totalBilled.toLocaleString()}</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-xl shadow text-green-700 dark:text-green-400">
          <div className="text-sm">Total Paid</div>
          <div className="text-2xl font-bold">KES {student.totalPaid.toLocaleString()}</div>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 p-5 rounded-xl shadow text-orange-700 dark:text-orange-400">
          <div className="text-sm">Balance</div>
          <div className="text-2xl font-bold">KES {student.balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record Payment</h3>
          <form onSubmit={payFee} className="space-y-4">
            <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (KES)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <select value={term} onChange={e => setTerm(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
            <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Record Payment</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record Exam Mark</h3>
          <form onSubmit={addExam} className="space-y-4">
            <input type="number" required value={marks} onChange={e => setMarks(e.target.value)} placeholder="Marks (0-100)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Add Mark</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Payment History</h3>
          <ul className="space-y-2">
            {student.payments.map(p => (
              <li key={p.id} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>{p.receipt_no} (Term {p.paid_for_term})</span>
                <span className="font-mono">KES {Number(p.amount).toLocaleString()}</span>
              </li>
            ))}
            {student.payments.length === 0 && <li className="text-slate-500">No payments recorded yet</li>}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Exam Performance</h3>
          <ul className="space-y-2">
            {student.exams.map((ex, i) => (
              <li key={i} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>{ex.name}</span>
                <span className="font-mono">{ex.marks} ({ex.grade})</span>
              </li>
            ))}
            {student.exams.length === 0 && <li className="text-slate-500">No exam records yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Frontend files updated!');