import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Zap, Mail, Lock, User, Building, ArrowRight, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

export const Auth: React.FC = () => {
  const { login, signup, resetPassword, isLoading } = useProject();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [role, setRole] = useState<string>(UserRole.FOUNDER);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (mode === 'LOGIN') {
      login(email, password);
    } else if (mode === 'SIGNUP') {
      signup(name, email, workspaceName, role, password);
    } else if (mode === 'FORGOT') {
      resetPassword(email);
    }
  };

  return (
    <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white overflow-y-auto">
      
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Scrollable Content Container */}
      <div className="min-h-full flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md my-auto">
          <div className="mb-10 text-center animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-6 transform hover:rotate-6 transition-transform duration-300">
              <Zap className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">VibeTrack</h1>
            <p className="text-lg text-slate-500">Manage projects at the speed of thought.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-full animate-fade-in-up delay-100">
            
            {/* Toggle Switch */}
            {mode !== 'FORGOT' && (
                <div className="bg-slate-100/80 p-1.5 rounded-xl flex mb-8 relative">
                <button 
                    type="button"
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${mode === 'LOGIN' ? 'text-indigo-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setMode('LOGIN')}
                >
                    Log In
                </button>
                <button 
                    type="button"
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${mode === 'SIGNUP' ? 'text-indigo-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setMode('SIGNUP')}
                >
                    Sign Up
                </button>
                </div>
            )}

            {mode === 'FORGOT' && (
                <div className="mb-8 text-center animate-fade-in-up">
                    <h3 className="text-xl font-bold text-slate-800">Reset Password</h3>
                    <p className="text-sm text-slate-500 mt-2">Enter your email to receive a reset link.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'SIGNUP' && (
                <div className="space-y-5 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Workspace</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Role</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <select 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                      >
                        {Object.values(UserRole).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {mode !== 'FORGOT' && (
                <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Password</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                    </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <span>{mode === 'LOGIN' ? 'Sign In' : mode === 'SIGNUP' ? 'Create Account' : 'Send Reset Link'}</span>
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
              </button>
            </form>

            {mode === 'LOGIN' && (
              <p className="mt-6 text-center text-sm text-slate-400">
                Forgot your password? <button type="button" onClick={() => setMode('FORGOT')} className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">Reset here</button>
              </p>
            )}

            {mode === 'FORGOT' && (
                <button 
                    type="button" 
                    onClick={() => setMode('LOGIN')}
                    className="w-full mt-6 text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                </button>
            )}
          </div>
          
          <p className="mt-8 text-center text-sm text-slate-400 font-medium pb-8">
            &copy; {new Date().getFullYear()} VibeTrack. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};