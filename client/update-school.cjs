const fs = require('fs');
const path = require('path');

const files = {
  'src/pages/SchoolProfile.jsx': `import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

export default function SchoolProfile() {
  const { register, handleSubmit, reset } = useForm();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [profile, setProfile] = useState({});

  useEffect(() => {
    api.get('/school').then(r => {
      setProfile(r.data);
      reset(r.data);
    }).catch(() => {});
  }, [reset]);

  const onSubmit = async (data) => {
    setMsg('');
    setErr('');
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
      });

      const logo = document.querySelector('input[name=logo]')?.files[0];
      const stamp = document.querySelector('input[name=stamp]')?.files[0];
      if (logo) fd.append('logo', logo);
      if (stamp) fd.append('stamp', stamp);

      const res = await api.put('/school', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Reload profile to show new logo
      api.get('/school').then(r => setProfile(r.data)).catch(() => {});
      setMsg('School profile saved successfully!');
    } catch (e) {
      setErr(e.response?.data?.error || 'Save failed');
    }
  };

  const inputCls = 'px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">School Profile</h1>
      
      {/* Display Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
          {profile.logo_path ? (
            <img src={profile.logo_path} alt="School Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 text-sm text-center">No Logo</span>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold">{profile.school_name || 'School Name Not Set'}</h2>
          <p className="text-slate-500 italic">{profile.motto || 'Motto not set'}</p>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            <p>{profile.address}, {profile.county}, {profile.sub_county}</p>
            <p>Phone: {profile.phone_primary} | Email: {profile.email}</p>
            <p>Principal: {profile.principal_name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {msg && <div className="text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded">{msg}</div>}
      {err && <div className="text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">{err}</div>}

      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <div className="md:col-span-2">
          <label className="text-sm block mb-1">School Name</label>
          <input {...register('school_name')} className={\`w-full \${inputCls}\`} placeholder="e.g. Bright Future Academy" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm block mb-1">Motto</label>
          <input {...register('motto')} className={\`w-full \${inputCls}\`} placeholder="Education for Excellence" />
        </div>

        <div>
          <label className="text-sm block mb-1">Vision</label>
          <input {...register('vision')} className={\`w-full \${inputCls}\`} />
        </div>
        <div>
          <label className="text-sm block mb-1">Mission</label>
          <input {...register('mission')} className={\`w-full \${inputCls}\`} />
        </div>

        <div>
          <label className="text-sm block mb-1">Address</label>
          <input {...register('address')} className={\`w-full \${inputCls}\`} />
        </div>
        <div>
          <label className="text-sm block mb-1">County</label>
          <input {...register('county')} className={\`w-full \${inputCls}\`} />
        </div>

        <div>
          <label className="text-sm block mb-1">Sub County</label>
          <input {...register('sub_county')} className={\`w-full \${inputCls}\`} />
        </div>
        <div>
          <label className="text-sm block mb-1">Email</label>
          <input type="email" {...register('email')} className={\`w-full \${inputCls}\`} />
        </div>

        <div>
          <label className="text-sm block mb-1">Phone (Primary)</label>
          <input {...register('phone_primary')} className={\`w-full \${inputCls}\`} />
        </div>
        <div>
          <label className="text-sm block mb-1">Phone (Secondary)</label>
          <input {...register('phone_secondary')} className={\`w-full \${inputCls}\`} />
        </div>

        <div>
          <label className="text-sm block mb-1">Principal Name</label>
          <input {...register('principal_name')} className={\`w-full \${inputCls}\`} />
        </div>
        <div>
          <label className="text-sm block mb-1">Deputy Principal</label>
          <input {...register('deputy_principal')} className={\`w-full \${inputCls}\`} />
        </div>

        <div>
          <label className="text-sm block mb-1">School Logo</label>
          <input type="file" name="logo" accept="image/*" className="w-full" />
        </div>
        <div>
          <label className="text-sm block mb-1">School Stamp</label>
          <input type="file" name="stamp" accept="image/*" className="w-full" />
        </div>

        <div className="md:col-span-2 border-t pt-4 mt-2">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('School Profile page updated!');