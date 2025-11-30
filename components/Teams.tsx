import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Users, Shield, Plus, X, UserPlus, Loader2 } from 'lucide-react';
import { Permission } from '../types';

export const Teams: React.FC = () => {
  const { teams, users, checkPermission, createTeam, addMemberToTeam, removeMemberFromTeam } = useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamToAddMember, setTeamToAddMember] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const getMemberDetails = (memberId: string) => users.find(u => u.id === memberId);
  const canManageTeams = checkPermission(Permission.MANAGE_TEAMS);

  const handleCreateTeam = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTeamName) return;
      
      setIsCreating(true);
      const success = await createTeam(newTeamName, selectedMembers);
      setIsCreating(false);

      if (success) {
          setNewTeamName('');
          setSelectedMembers([]);
          setShowCreateModal(false);
      }
  };

  const handleAddMember = (userId: string) => {
      if (teamToAddMember) {
          addMemberToTeam(teamToAddMember, userId);
          setTeamToAddMember(null);
      }
  };

  const toggleMemberSelection = (userId: string) => {
      if (selectedMembers.includes(userId)) {
          setSelectedMembers(prev => prev.filter(id => id !== userId));
      } else {
          setSelectedMembers(prev => [...prev, userId]);
      }
  };

  return (
    <div className="h-full bg-slate-50 p-4 md:p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-slate-400" />
          Teams
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage functional teams and member capacity.</p>
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
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Members</label>
                                {canManageTeams && (
                                    <button 
                                        onClick={() => setTeamToAddMember(team.id)}
                                        className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                    >
                                        <UserPlus className="w-3 h-3 mr-1" />
                                        Add
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {team.members.filter(m => m !== team.leadId).map(memberId => {
                                    const member = getMemberDetails(memberId);
                                    if (!member) return null;
                                    return (
                                        <div key={member.id} className="group flex items-center justify-between p-1.5 hover:bg-slate-50 rounded transition-colors">
                                            <div className="flex items-center space-x-2">
                                                <img src={member.avatar} className="w-6 h-6 rounded-full" alt="" />
                                                <span className="text-sm text-slate-700">{member.name}</span>
                                            </div>
                                            {canManageTeams && (
                                                <button 
                                                    onClick={() => removeMemberFromTeam(team.id, member.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-all"
                                                    title="Remove member"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                {team.members.length <= 1 && (
                                    <p className="text-xs text-slate-400 italic py-1">No other members</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
        
        {canManageTeams && (
            <button 
                onClick={() => setShowCreateModal(true)}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all min-h-[200px] gap-2 p-6"
            >
                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-white transition-colors">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="font-medium">Create New Team</span>
            </button>
        )}
      </div>

      {/* Add Member Modal */}
      {teamToAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Add Team Member</h3>
                    <button onClick={() => setTeamToAddMember(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                    {users
                        .filter(u => {
                            const team = teams.find(t => t.id === teamToAddMember);
                            return team && !team.members.includes(u.id);
                        })
                        .length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">All users are already in this team.</p>
                        ) : (
                            <div className="space-y-1">
                                {users
                                    .filter(u => {
                                        const team = teams.find(t => t.id === teamToAddMember);
                                        return team && !team.members.includes(u.id);
                                    })
                                    .map(u => (
                                        <button 
                                            key={u.id}
                                            onClick={() => handleAddMember(u.id)}
                                            className="w-full flex items-center space-x-3 p-2 hover:bg-indigo-50 rounded-lg transition-colors text-left group"
                                        >
                                            <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.role}</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                                        </button>
                                    ))
                                }
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
      )}

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
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg custom-scrollbar">
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
                            disabled={isCreating}
                            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center ${isCreating ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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