import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { User, CheckCircle, Clock, PieChart as PieIcon, Briefcase } from 'lucide-react';
import { Status, UserRole } from '../types';

export const Profile: React.FC = () => {
  const { currentUser, updateUser, issues } = useProject();
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [role, setRole] = useState(currentUser.role);
  const [isSaved, setIsSaved] = useState(false);

  // Stats
  const assignedIssues = issues.filter(i => i.assigneeId === currentUser.id);
  const completedIssues = assignedIssues.filter(i => i.status === Status.DONE);
  const completionRate = assignedIssues.length > 0 
    ? Math.round((completedIssues.length / assignedIssues.length) * 100) 
    : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, { name, avatar, role });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group">
                <img 
                    src={avatar} 
                    alt="Profile" 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white text-xs font-medium">Change</span>
                </div>
            </div>
            <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{name}</h1>
                <p className="text-slate-500 font-medium text-lg mb-4">{role}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
                    <div className="text-center md:text-left min-w-[80px]">
                        <span className="block text-2xl font-bold text-slate-800">{assignedIssues.length}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Assigned</span>
                    </div>
                    <div className="text-center md:text-left min-w-[80px]">
                        <span className="block text-2xl font-bold text-slate-800">{completionRate}%</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Completion</span>
                    </div>
                     <div className="text-center md:text-left min-w-[80px]">
                        <span className="block text-2xl font-bold text-slate-800">{assignedIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0)}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Velocity</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Profile Settings</h2>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Role / Job Title</label>
                        <div className="relative">
                            <select 
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white"
                            >
                                {Object.values(UserRole).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <Briefcase className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        value={currentUser.email}
                        disabled
                        className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg p-2.5 outline-none cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed by user.</p>
                </div>

                <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Avatar URL</label>
                     <input 
                        type="text" 
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-mono text-slate-600"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                     <button
                        type="submit"
                        className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-slate-200"
                    >
                        {isSaved ? 'Changes Saved' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};