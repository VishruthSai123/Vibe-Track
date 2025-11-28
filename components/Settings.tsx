
import React, { useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { Save, Users, Settings as SettingsIcon, Shield, Trash2, Mail, X } from 'lucide-react';
import { Permission } from '../types';

export const Settings: React.FC = () => {
  const { activeProject, updateProjectInfo, users, checkPermission, inviteUser } = useProject();
  
  const [name, setName] = useState(activeProject?.name || '');
  const [key, setKey] = useState(activeProject?.key || '');
  const [description, setDescription] = useState(activeProject?.description || '');
  const [leadId, setLeadId] = useState(activeProject?.leadId || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // RBAC Checks
  const canDeleteProject = checkPermission(Permission.DELETE_PROJECT);
  const canManageAccess = checkPermission(Permission.MANAGE_ACCESS);
  const isReadOnly = !checkPermission(Permission.CREATE_PROJECT); // Simplified: If you can't create, you likely can't edit settings

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
      setKey(activeProject.key);
      setDescription(activeProject.description);
      setLeadId(activeProject.leadId);
    }
  }, [activeProject]);

  if (!activeProject) {
      return <div className="p-8 text-center text-slate-500">Please select a project to view settings.</div>;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if(isReadOnly) return;
    
    updateProjectInfo({ 
        ...activeProject,
        name, 
        key, 
        description, 
        leadId 
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail) return;
      await inviteUser(inviteEmail);
      setInviteEmail('');
      setShowInviteModal(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6 text-slate-400" />
                    Project Settings
                </h1>
                <p className="text-slate-500 mt-1">Manage project details, identifiers, and team access.</p>
            </div>
            {canDeleteProject && (
                <button className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                </button>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 p-4">
             <div className="flex space-x-6">
                 <button className="text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-4 -mb-4.5">General</button>
                 <button className="text-sm font-medium text-slate-500 hover:text-slate-700 pb-4">Notifications</button>
                 <button className="text-sm font-medium text-slate-500 hover:text-slate-700 pb-4">Automations</button>
             </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Project Key</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={key}
                      maxLength={5}
                      onChange={(e) => setKey(e.target.value.toUpperCase())}
                      disabled={isReadOnly}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase font-mono disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">Prefix for issues (e.g. VIBE-123)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isReadOnly}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Lead</label>
                <div className="relative">
                  <select 
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                  >
                     {users.map(u => (
                       <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                     ))}
                  </select>
                  <Shield className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {!isReadOnly && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                    type="submit"
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
                    >
                    <Save className="w-4 h-4" />
                    <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
                    </button>
                    <div className="text-sm text-slate-500">
                    Last updated today
                    </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                Team Members
            </h3>
            <div className="space-y-4">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                        <div className="flex items-center space-x-3">
                            <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
                            <div>
                                <p className="font-medium text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email} • {user.role}</p>
                            </div>
                        </div>
                        {canManageAccess ? (
                             <select className="text-sm border-none bg-slate-50 rounded px-2 py-1 text-slate-600 focus:ring-0">
                                <option>Admin</option>
                                <option>Member</option>
                                <option>Viewer</option>
                            </select>
                        ) : (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Member</span>
                        )}
                    </div>
                ))}
                {canManageAccess && (
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium"
                    >
                        + Invite New Member
                    </button>
                )}
            </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Invite Team Member</h3>
                        <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleInvite} className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="colleague@company.com"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button 
                                type="button" 
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                            >
                                Send Invitation
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
