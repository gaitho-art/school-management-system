import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiUsers, FiUserCheck, FiDollarSign, FiTrendingDown, FiBookOpen, FiCreditCard } from 'react-icons/fi';

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Students', value: stats.students ?? '—', icon: FiUsers, color: 'bg-blue-500' },
    { label: 'Total Teachers', value: stats.teachers ?? '—', icon: FiBookOpen, color: 'bg-green-500' },
    { label: 'Present Today', value: stats.present_today ?? '—', icon: FiUserCheck, color: 'bg-purple-500' },
    { label: 'Total Fees Collected', value: stats.fees_collected ? 'KES ' + Number(stats.fees_collected).toLocaleString() : '—', icon: FiDollarSign, color: 'bg-orange-500' },
    { label: 'Total Expenses', value: stats.total_expenses ? 'KES ' + Number(stats.total_expenses).toLocaleString() : '—', icon: FiTrendingDown, color: 'bg-red-500' },
    { label: 'Net Balance', value: (stats.fees_collected - stats.total_expenses) ? 'KES ' + Number(stats.fees_collected - stats.total_expenses).toLocaleString() : '—', icon: FiCreditCard, color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow flex items-center gap-4">
            <div className={`${c.color} p-3 rounded-lg text-white`}><c.icon size={24} /></div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{c.label}</div>
              <div className="text-2xl font-bold mt-1">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}