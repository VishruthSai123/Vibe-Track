
import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Users, Shield, Plus, X } from 'lucide-react';
import { Permission } from '../types';

export const Teams: React.FC = () => {
  const { teams, users, checkPermission, createTeam } = useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const getMemberDetails = (memberId: string) => users.find(u => u.id === memberId);
  const canManageTeams = checkPermission(Permission.MANAGE_TEAMS);

  const handleCreateTeam = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTeamName) return;
      createTeam(newTeamName, selectedMembers);
      setNewTeamName('');
      setSelectedMembers([]);
      setShowCreateModal(false);
  };

  const toggleMemberSelection = (userId: string) => {
      if (selectedMembers.includes(userId)) {
          setSelectedMembers(prev => prev.filter(id => id !== userId));
      } else {
          setSelectedMembers(prev => [...prev, userId]);
      }
  };

  return (
    <div className="h-full bg-slate-50 p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-slate-400" />
          Teams
        </h1>
        <p className="text-slate-500 mt-1">Manage functional teams and member capacity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => {
            const lead = getMemberDetails(team.leadId);
            return (
                <div key={team.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">{team.name}</h3>
                        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">
                            {team.members.length} members
                        </span>
                    </div>
                    <div className="p-4">
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Team Lead</label>
                            {lead ? (
                                <div className="flex items-center space-x-2">
                                    <img src={lead.avatar} className="w-8 h-8 rounded-full border border-slate-100" alt={lead.name} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{lead.name}</p>
                                        <p className="text-xs text-slate-500">{lead.role}</p>
                                    </div>
                                    <Shield className="w-4 h-4 text-indigo-500 ml-auto" />
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400 italic">No lead assigned</span>
                            )}
                        </div>
                        
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Members</label>
                            <div className="space-y-2">
                                {team.members.filter(m => m !== team.leadId).map(memberId => {
                                    const member = getMemberDetails(memberId);
                                    if (!member) return null;
                                    return (
                                        <div key={member.id} className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded transition-colors">
                                            <img src={member.avatar} className="w-6 h-6 rounded-full" alt="" />
                                            <span className="text-sm text-slate-700">{member.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
        
        {canManageTeams && (
            <button 
                onClick={() => setShowCreateModal(true)}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all min-h-[250px] gap-2 p-6"
            >
                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-white transition-colors">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="font-medium">Create New Team</span>
            </button>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Create New Team</h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleCreateTeam} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                        <input 
                            type="text" 
                            required
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Mobile Engineering"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Members</label>
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                            {users.map(u => (
                                <div 
                                    key={u.id}
                                    onClick={() => toggleMemberSelection(u.id)}
                                    className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0 ${selectedMembers.includes(u.id) ? 'bg-indigo-50' : ''}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{u.name}</p>
                                            <p className="text-xs text-slate-500">{u.role}</p>
                                        </div>
                                    </div>
                                    {selectedMembers.includes(u.id) && (
                                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                            <Plus className="w-3 h-3 text-white transform rotate-45" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                        >
                            Create Team
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
