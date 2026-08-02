import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiPlus, FiTrash } from 'react-icons/fi';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'General' });

  const loadExpenses = () => api.get('/expenses').then(r => setExpenses(r.data));

  useEffect(() => { loadExpenses(); }, []);

  const addExpense = async (e) => {
    e.preventDefault();
    await api.post('/expenses', { ...form, amount: Number(form.amount) });
    setForm({ description: '', amount: '', category: 'General' });
    loadExpenses();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense record?')) {
      await api.delete('/expenses/' + id);
      loadExpenses();
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">School Expenses (Money Out)</h1>
      <div className="bg-red-100 dark:bg-red-900/30 p-5 rounded-xl shadow text-red-700 dark:text-red-400">
        <div className="text-sm">Total Recorded Expenses</div>
        <div className="text-3xl font-bold">KES {totalExpenses.toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record New Expense</h3>
          <form onSubmit={addExpense} className="space-y-4">
            <input required placeholder="Description (e.g. Bought Chalk)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <input required type="number" placeholder="Amount (KES)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option>General</option><option>Salaries</option><option>Maintenance</option><option>Supplies</option><option>Utilities</option>
            </select>
            <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 flex items-center gap-2"><FiPlus /> Record Expense</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Expense History</h3>
          <ul className="space-y-2">
            {expenses.map(exp => (
              <li key={exp.id} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <div>
                  <span className="font-medium">{exp.description}</span>
                  <span className="block text-xs text-slate-400">{exp.category} - {new Date(exp.expense_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-red-500">KES {Number(exp.amount).toLocaleString()}</span>
                  <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700"><FiTrash /></button>
                </div>
              </li>
            ))}
            {expenses.length === 0 && <li className="text-slate-500">No expenses recorded yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}