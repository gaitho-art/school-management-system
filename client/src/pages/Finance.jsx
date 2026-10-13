import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiSearch, FiPrinter, FiDownload } from 'react-icons/fi';

export default function Finance() {
  const [overview, setOverview] = useState({ collected: 0, expected: 0, outstanding: 0 });
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStudent, setPaymentStudent] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('1');
  const [paymentType, setPaymentType] = useState('school_fees');
  const [loading, setLoading] = useState(true);

  const loadStudents = () => api.get('/students').then(r => setStudents(r.data)).catch(() => {});
  const loadTransactions = () => api.get('/finance/transactions').then(r => setTransactions(r.data)).catch(() => {});
  const loadOverview = () => api.get('/finance/overview').then(r => setOverview(r.data)).catch(() => {});

  useEffect(() => {
    setLoading(true);
    loadOverview();
    Promise.all([loadTransactions(), loadStudents(), api.get('/streams').then(r => setClasses(r.data)).catch(() => {})])
      .finally(() => setLoading(false));
  }, []);

  const filteredTx = transactions.filter(t => {
    const matchesText = (t.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.receipt_no || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || String(t.stream_id || '') === String(selectedClass);
    return matchesText && matchesClass;
  });

  const outstandingStudents = students
    .map((s) => ({
      ...s,
      total_balance: Number(s.fees_balance || 0) + Number(s.transport_balance || 0)
    }))
    .filter((s) => s.total_balance > 0);

  const recordPayment = async (e) => {
    e.preventDefault();
    if (!paymentStudent) return alert('Select a student first');
    await api.post('/fees/payment', {
      student_id: paymentStudent,
      amount: Number(paymentAmount),
      payment_method: 'cash',
      paid_for_term: Number(paymentTerm),
      payment_type: paymentType
    });
    setPaymentAmount('');
    setPaymentStudent('');
    loadOverview();
    loadTransactions();
    loadStudents();
  };

  const printReport = () => window.print();
  const downloadReport = () => {
    const rows = filteredTx.map((t) => `${t.receipt_no},${t.full_name},${t.admission_number},${t.paid_for_term},${t.payment_method},${t.payment_date},${t.expected_term_amount},${t.balance},${t.amount}`).join('\n');
    const blob = new Blob([`Receipt No,Student Name,Admission No,Term,Method,Date,Expected/Term,Balance,Amount\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fees-report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Fees & Finance Management</h1>
        <div className="flex gap-2">
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white"><FiPrinter /> Print</button>
          <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white"><FiDownload /> Download</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border-l-4 border-green-500">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Collected</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">KES {Number(overview.collected).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border-l-4 border-blue-500">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Expected</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">KES {Number(overview.expected).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border-l-4 border-red-500">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Outstanding</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">KES {Number(overview.outstanding).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Class-wise Fee Summary</h2>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-xl dark:bg-slate-700 dark:border-slate-600">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.grade_name} - {c.name}</option>)}
            </select>
            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search receipt or name..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-11 pr-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
              <tr>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Receipt No</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Student Name</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Adm No</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Term</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Expected / Term</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Balance</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Method</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="p-4 text-center text-slate-500">Loading transactions...</td></tr>
              ) : (
                filteredTx.map(t => (
                  <tr key={t.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{t.receipt_no}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{t.full_name}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{t.admission_number}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">Term {t.paid_for_term}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">KES {Number(t.expected_term_amount).toLocaleString()}</td>
                    <td className={`p-4 text-right font-mono font-bold ${t.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>KES {Number(t.balance).toLocaleString()}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 capitalize">{t.payment_method}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{new Date(t.payment_date).toLocaleDateString()}</td>
                    <td className="p-4 text-right font-mono font-bold text-green-600">KES {Number(t.amount).toLocaleString()}</td>
                  </tr>
                ))
              )}
              {!loading && filteredTx.length === 0 && (
                <tr><td colSpan="9" className="p-8 text-center text-slate-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}