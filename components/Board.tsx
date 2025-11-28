import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { COLUMNS, Issue, Status } from '../types';
import { IssueCard } from './IssueCard';
import { IssueModal } from './IssueModal';
import { Plus, CheckCircle, Users, AlertTriangle, X, Clock } from 'lucide-react';

export const Board: React.FC = () => {
  const { issues, users, updateIssue, activeSprint, completeSprint, searchQuery } = useProject();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [spilloverAction, setSpilloverAction] = useState<'BACKLOG' | 'NEXT_SPRINT'>('BACKLOG');

  // If no active sprint, show empty state
  if (!activeSprint) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
              <div className="bg-white p-12 rounded-2xl shadow-xl border border-slate-100 max-w-md animate-fade-in-up">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Clock className="w-10 h-10 text-indigo-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">No Active Sprint</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                      Your team isn't currently running a sprint. Head over to the Backlog to plan and kick off your next sprint.
                  </p>
                  <div className="inline-flex items-center text-indigo-600 font-semibold text-sm border border-indigo-200 bg-indigo-50 px-4 py-2 rounded-lg">
                      Go to Backlog
                  </div>
              </div>
          </div>
      );
  }

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    setDraggedIssueId(issueId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", issueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (draggedIssueId) {
      updateIssue(draggedIssueId, { status });
      setDraggedIssueId(null);
    }
  };

  // Filter issues
  const activeIssues = issues.filter(i => {
    const matchesSprint = i.sprintId === activeSprint.id;
    const matchesSearch = searchQuery 
        ? (i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
    const matchesUser = selectedUserId ? i.assigneeId === selectedUserId : true;
    return matchesSprint && matchesSearch && matchesUser;
  });

  const getIssuesByStatus = (status: Status) => {
    return activeIssues.filter(i => i.status === status);
  };

  // Calculations for Complete Modal
  const completedIssues = activeIssues.filter(i => i.status === Status.DONE);
  const incompleteIssues = activeIssues.filter(i => i.status !== Status.DONE);

  const handleCompleteSprint = () => {
      completeSprint(activeSprint.id, spilloverAction);
      setShowCompleteModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Board Header */}
      <div className="px-8 py-5 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-slate-800">{activeSprint.name}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide border border-indigo-100">
                        Active
                    </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 max-w-xl truncate">{activeSprint.goal}</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-medium flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        {activeSprint.endDate ? 
                            `${Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left` :
                            'No deadline'
                        }
                    </span>
                </div>
                <button 
                    onClick={() => setShowCompleteModal(true)}
                    className="bg-slate-900 text-white hover:bg-black px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md"
                    >
                    Complete Sprint
                </button>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 uppercase mr-2 tracking-wider">Assignee:</span>
              <div className="flex -space-x-2 mr-2">
                  {users.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => setSelectedUserId(selectedUserId === u.id ? null : u.id)}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all hover:z-10 hover:scale-110 ${selectedUserId === u.id ? 'border-indigo-500 ring-2 ring-indigo-200 z-10' : 'border-white opacity-80 hover:opacity-100'}`}
                        title={u.name}
                      >
                          <img src={u.avatar} className="w-full h-full rounded-full" alt={u.name} />
                      </button>
                  ))}
              </div>
              {selectedUserId && (
                  <button 
                    onClick={() => setSelectedUserId(null)}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-medium px-2 flex items-center space-x-1 bg-slate-100 rounded-full py-0.5 transition-colors"
                  >
                      <X className="w-3 h-3" />
                      <span>Clear</span>
                  </button>
              )}
          </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap p-6 bg-slate-50">
        <div className="flex space-x-6 h-full">
            {COLUMNS.map(column => {
                const columnIssues = getIssuesByStatus(column.id);
                return (
                    <div 
                        key={column.id} 
                        className="w-80 flex-shrink-0 flex flex-col bg-slate-100/50 rounded-xl max-h-full border border-slate-200/60 shadow-sm transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className="p-3 px-4 font-semibold text-xs uppercase text-slate-500 tracking-wider flex justify-between items-center bg-white/40 rounded-t-xl backdrop-blur-sm border-b border-slate-200/50 sticky top-0">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full shadow-sm ${
                                    column.id === Status.DONE ? 'bg-emerald-500' :
                                    column.id === Status.IN_PROGRESS ? 'bg-indigo-500' :
                                    column.id === Status.IN_REVIEW ? 'bg-purple-500' : 'bg-slate-400'
                                }`} />
                                <span>{column.title}</span>
                            </div>
                            <span className="bg-white text-slate-600 px-2 py-0.5 rounded-full text-[10px] min-w-[20px] text-center shadow-sm border border-slate-100 font-bold">
                                {columnIssues.length}
                            </span>
                        </div>
                        
                        {/* Issues List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {columnIssues.map(issue => (
                                <IssueCard 
                                    key={issue.id} 
                                    issue={issue} 
                                    users={users} 
                                    onClick={setSelectedIssue}
                                    onDragStart={handleDragStart}
                                />
                            ))}
                            {columnIssues.length === 0 && (
                                <div className="h-32 border-2 border-dashed border-slate-200/70 rounded-lg flex items-center justify-center text-slate-400 text-sm flex-col space-y-2 opacity-60">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">No Issues</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Complete Sprint Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up transform transition-all">
                 <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                     <div className="flex items-center space-x-4 mb-1">
                         <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 shadow-sm border border-indigo-200">
                             <CheckCircle className="w-8 h-8" />
                         </div>
                         <div>
                             <h2 className="text-xl font-bold text-slate-800">Complete Sprint</h2>
                             <p className="text-sm text-slate-500 font-medium">
                                 {activeSprint.name}
                             </p>
                         </div>
                     </div>
                 </div>
                 
                 <div className="p-8 space-y-8">
                     <div className="flex gap-4">
                         <div className="flex-1 p-5 bg-green-50 border border-green-100 rounded-xl text-center shadow-sm">
                             <div className="text-3xl font-bold text-green-700 mb-1">{completedIssues.length}</div>
                             <div className="text-xs font-bold text-green-600 uppercase tracking-wide">Completed Issues</div>
                         </div>
                         <div className="flex-1 p-5 bg-orange-50 border border-orange-100 rounded-xl text-center shadow-sm">
                             <div className="text-3xl font-bold text-orange-700 mb-1">{incompleteIssues.length}</div>
                             <div className="text-xs font-bold text-orange-600 uppercase tracking-wide">Open Issues</div>
                         </div>
                     </div>

                     {incompleteIssues.length > 0 && (
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-3">Move incomplete issues to:</label>
                             <div className="space-y-3">
                                 <label className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${spilloverAction === 'BACKLOG' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${spilloverAction === 'BACKLOG' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                         {spilloverAction === 'BACKLOG' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                                     </div>
                                     <input 
                                        type="radio" 
                                        name="spillover" 
                                        value="BACKLOG" 
                                        checked={spilloverAction === 'BACKLOG'}
                                        onChange={() => setSpilloverAction('BACKLOG')}
                                        className="hidden"
                                     />
                                     <span className="text-sm font-medium text-slate-800">Backlog</span>
                                 </label>
                                 <label className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${spilloverAction === 'NEXT_SPRINT' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${spilloverAction === 'NEXT_SPRINT' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                         {spilloverAction === 'NEXT_SPRINT' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                                     </div>
                                     <input 
                                        type="radio" 
                                        name="spillover" 
                                        value="NEXT_SPRINT" 
                                        checked={spilloverAction === 'NEXT_SPRINT'}
                                        onChange={() => setSpilloverAction('NEXT_SPRINT')}
                                        className="hidden"
                                     />
                                     <span className="text-sm font-medium text-slate-800">New Sprint</span>
                                 </label>
                             </div>
                         </div>
                     )}
                     
                     {incompleteIssues.length === 0 && (
                        <div className="flex items-center justify-center p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium">
                            <span className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                All issues completed! Great job team.
                            </span>
                        </div>
                     )}
                 </div>

                 <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                     <button 
                        onClick={() => setShowCompleteModal(false)}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                     >
                         Cancel
                     </button>
                     <button 
                        onClick={handleCompleteSprint}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                     >
                         Complete Sprint
                     </button>
                 </div>
             </div>
        </div>
      )}

      {selectedIssue && (
        <IssueModal 
            issue={selectedIssue} 
            onClose={() => setSelectedIssue(null)} 
        />
      )}
    </div>
  );
};