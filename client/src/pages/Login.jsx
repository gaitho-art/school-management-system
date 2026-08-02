import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [err, setErr] = useState('');

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center">EAGLE HEIGHT ACADEMY</h1>
        {err && <div className="text-red-500 text-sm text-center">{err}</div>}
        <div>
          <label className="text-sm block mb-1">Username</label>
          <input {...register('username')} placeholder="admin" className="w-full px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
        </div>
        <div>
          <label className="text-sm block mb-1">Password</label>
          <input type="password" {...register('password')} placeholder="••••••••" className="w-full px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign in</button>
      </form>
    </div>
  );
}