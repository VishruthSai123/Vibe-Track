import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Zap, Mail, Lock, User, Building, ArrowRight, Briefcase } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup } = useProject();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mock password
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [role, setRole] = useState('Developer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'LOGIN') {
      login(email, password);
    } else {
      signup(name, email, workspaceName, role, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center animate-fade-in-up">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-200 shadow-xl mb-4 rotate-3">
          <Zap className="w-10 h-10 text-white" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">VibeTrack</h1>
        <p className="text-slate-500 mt-2">Manage projects at the speed of thought.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 animate-fade-in-up delay-100">
        <div className="flex border-b border-slate-100 mb-6">
          <button 
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${mode === 'LOGIN' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
            onClick={() => setMode('LOGIN')}
          >
            Log In
          </button>
          <button 
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${mode === 'SIGNUP' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
            onClick={() => setMode('SIGNUP')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Workspace Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none text-slate-700"
                  >
                    <option value="Founder">Founder</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2 mt-4"
          >
            <span>{mode === 'LOGIN' ? 'Sign In' : 'Create Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode === 'LOGIN' && (
           <div className="mt-6 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
             <span className="font-bold">Demo Tip:</span> Use <code>alex@vibetrack.com</code> to login with pre-populated data.
           </div>
        )}
      </div>
    </div>
  );
};