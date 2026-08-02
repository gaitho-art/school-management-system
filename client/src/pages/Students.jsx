import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus, FiSearch, FiTrash } from 'react-icons/fi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filterGrade, setFilterGrade] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStudents = () => {
    setLoading(true);
    api.get('/students').then(r => {
      setStudents(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
    loadStudents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      await api.delete('/students/' + id);
      loadStudents();
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade ? s.grade_name === filterGrade : true;
    const matchesSearch = searchTerm ? 
      (s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())) 
      : true;
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Students</h1>
        <Link to="/students/add" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
          <FiPlus /> Register Student
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Search Student</label>
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
            <input type="text" placeholder="Search by name or admission no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
        </div>
        <div className="w-full md:w-64">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Filter by Class</label>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
            <option value="">All Classes</option>
            {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <tr>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Admission No</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Gender</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Class</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b dark:border-slate-700">
                  <td className="p-5"><div className="skeleton h-4 w-24"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-40"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-20"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-24"></div></td>
                </tr>
              ))
            ) : (
              filteredStudents.map(s => (
                <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.admission_number}</td>
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{s.full_name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.gender}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.grade_name || 'Unassigned'}</td>
                  <td className="p-5 capitalize">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-5 flex gap-4">
                    <Link to={`/students/${s.id}`} className="text-blue-500 hover:text-blue-600 transition-colors font-medium">View/Edit</Link>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-medium"><FiTrash /> Delete</button>
                  </td>
                </tr>
              ))
            )}
            
            {!loading && filteredStudents.length === 0 && (
              <tr><td colSpan="6" className="p-10 text-center text-slate-500">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}