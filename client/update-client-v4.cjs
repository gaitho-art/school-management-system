const fs = require('fs');
const path = require('path');

const files = {
  'src/pages/Students.jsx': `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus, FiSearch } from 'react-icons/fi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filterGrade, setFilterGrade] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
    api.get('/students').then(r => setStudents(r.data)).catch(() => {});
  }, []);

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
        <h1 className="text-2xl font-bold">Students</h1>
        <Link to="/students/add" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <FiPlus /> Register Student
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="font-semibold block mb-1">Search Student</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder="Search by name or admission no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded dark:bg-slate-700" />
          </div>
        </div>
        <div className="w-full md:w-64">
          <label className="font-semibold block mb-1">Filter by Class</label>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
            <option value="">All Classes</option>
            {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Admission No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Gender</th>
              <th className="p-4">Class</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(s => (
              <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-4">{s.admission_number}</td>
                <td className="p-4">{s.full_name}</td>
                <td className="p-4">{s.gender}</td>
                <td className="p-4">{s.grade_name || 'Unassigned'}</td>
                <td className="p-4 capitalize">{s.status}</td>
                <td className="p-4">
                  <Link to={\`/students/\${s.id}\`} className="text-blue-500 hover:underline">View Profile & Marks</Link>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr><td colSpan="6" className="p-4 text-center text-slate-500">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
  'src/pages/StudentProfile.jsx': `import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('1');
  const [marks, setMarks] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const loadStudent = () => api.get(\`/students/\${id}\`).then(r => setStudent(r.data));

  useEffect(() => { 
    loadStudent(); 
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  const payFee = async (e) => {
    e.preventDefault();
    await api.post('/fees/payment', { student_id: id, amount: Number(amount), payment_method: 'cash', paid_for_term: Number(term) });
    setAmount('');
    loadStudent();
  };

  const addExam = async (e) => {
    e.preventDefault();
    if (!subjectId) return alert('Please select a subject');
    await api.post('/exams/results', { student_id: id, exam_id: 1, subject_id: subjectId, marks: Number(marks), grade: 'A' });
    setMarks('');
    setSubjectId('');
    loadStudent();
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <p className="text-slate-500">Adm: {student.admission_number} | Class: {student.grade_name || 'Unassigned'} | Guardian: {student.guardian_name} ({student.guardian_phone})</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="bg-purple-100 dark:bg-purple-900/30 p-5 rounded-xl shadow text-purple-700 dark:text-purple-400">
          <div className="text-sm">Total Marks</div>
          <div className="text-2xl font-bold">{student.totalMarks}</div>
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
            <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
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
                <span>{ex.exam_name} - {ex.subject_name}</span>
                <span className="font-mono">{ex.marks} ({ex.grade})</span>
              </li>
            ))}
            {student.exams.length === 0 && <li className="text-slate-500">No exam records yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}`,
  'src/pages/Classes.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Classes() {
  const [streams, setStreams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [selStream, setSelStream] = useState('');
  const [selTeacher, setSelTeacher] = useState('');
  const [selSubject, setSelSubject] = useState('');

  const loadData = () => {
    api.get('/streams').then(r => setStreams(r.data));
    api.get('/teachers').then(r => setTeachers(r.data));
    api.get('/subjects').then(r => setSubjects(r.data));
    api.get('/assignments').then(r => setAssignments(r.data));
  };

  useEffect(() => { loadData(); }, []);

  const assign = async (e) => {
    e.preventDefault();
    if (!selStream || !selTeacher || !selSubject) return alert('Please select class, teacher, and subject');
    await api.post('/assignments', { stream_id: selStream, teacher_id: selTeacher, subject_id: selSubject });
    setSelStream(''); setSelTeacher(''); setSelSubject('');
    loadData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Class & Subject Management</h1>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">Assign Teacher to Subject & Class</h3>
        <form onSubmit={assign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm block mb-1">Class</label>
            <select value={selStream} onChange={e => setSelStream(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select...</option>
              {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Teacher</label>
            <select value={selTeacher} onChange={e => setSelTeacher(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Subject</label>
            <select value={selSubject} onChange={e => setSelSubject(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Assign</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">Current Teacher Assignments</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Class</th>
              <th className="p-4">Teacher</th>
              <th className="p-4">Subject</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="border-b dark:border-slate-700">
                <td className="p-4">{a.grade_name} - {a.stream_name}</td>
                <td className="p-4">{a.teacher_name}</td>
                <td className="p-4">{a.subject_name}</td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr><td colSpan="3" className="p-4 text-center text-slate-500">No assignments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Frontend updated successfully!');