
import React, { useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { Issue, IssueType, Priority, Sprint, Permission } from '../types';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, X, GripVertical, Calendar } from 'lucide-react';
import { IssueModal } from './IssueModal';

export const Backlog: React.FC = () => {
  const { issues, sprints, users, createSprint, startSprint, updateIssue, searchQuery, activeProject, checkPermission } = useProject();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [showStartSprintModal, setShowStartSprintModal] = useState(false);
  const [sprintToStart, setSprintToStart] = useState<Sprint | null>(null);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  
  // Sprint Creation State
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintCapacity, setNewSprintCapacity] = useState<number>(30);

  // Sprint Start State
  const [startDuration, setStartDuration] = useState('2');
  const [startStartDate, setStartStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startEndDate, setStartEndDate] = useState('');
  const [startGoal, setStartGoal] = useState('');

  // Permissions
  const canCreateSprint = checkPermission(Permission.CREATE_SPRINT);
  const canManageSprint = checkPermission(Permission.MANAGE_SPRINT);
  const canCreateTask = checkPermission(Permission.CREATE_TASK);

  // Update End Date when duration or start date changes
  useEffect(() => {
    const start = new Date(startStartDate);
    const weeks = parseInt(startDuration);
    if (!isNaN(weeks) && start) {
        const end = new Date(start);
        end.setDate(start.getDate() + (weeks * 7));
        setStartEndDate(end.toISOString().split('T')[0]);
    }
  }, [startStartDate, startDuration]);

  const toggleSprint = (id: string) => {
    setCollapsedSprints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getIssuesForSprint = (sprintId: string | null) => {
    return issues.filter(i => {
        const matchesSprint = i.sprintId === sprintId;
        const matchesSearch = searchQuery 
            ? (i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase()))
            : true;
        return matchesSprint && matchesSearch;
    });
  };

  const backlogIssues = getIssuesForSprint(null);
  
  // Sort sprints: Active first, then by name
  const sortedSprints = [...sprints].sort((a, b) => {
    if (a.status === 'ACTIVE') return -1;
    if (b.status === 'ACTIVE') return 1;
    return a.id.localeCompare(b.id);
  });

  const openStartSprintModal = (sprint: Sprint) => {
      setSprintToStart(sprint);
      setStartGoal(sprint.goal || '');
      setShowStartSprintModal(true);
  };

  const handleStartSprintConfirm = (e: React.FormEvent) => {
      e.preventDefault();
      if (!sprintToStart) return;
      startSprint(sprintToStart.id, new Date(startStartDate).toISOString(), new Date(startEndDate).toISOString(), startGoal);
      setShowStartSprintModal(false);
      setSprintToStart(null);
  };

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    createSprint(newSprintName || `Sprint ${sprints.length + 1}`, newSprintGoal, newSprintCapacity);
    setShowCreateSprintModal(false);
    setNewSprintName('');
    setNewSprintGoal('');
    setNewSprintCapacity(30);
  };

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
      setDraggedIssueId(issueId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', issueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, sprintId: string | null) => {
      e.preventDefault();
      if (draggedIssueId) {
          updateIssue(draggedIssueId, { sprintId });
          setDraggedIssueId(null);
      }
  };

  if (!activeProject) return <div>Select a project</div>;

  return (
    <div className="h-full overflow-y-auto bg-white p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Backlog</h1>
            <p className="text-sm text-slate-500">{activeProject.name} Planning</p>
        </div>
        {canCreateSprint && (
            <button 
                onClick={() => setShowCreateSprintModal(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
            >
                Create Sprint
            </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Sprints Section */}
        {sortedSprints.filter(s => s.status !== 'COMPLETED').map(sprint => {
             const sprintIssues = getIssuesForSprint(sprint.id);
             const totalPoints = sprintIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
             const isCollapsed = collapsedSprints[sprint.id];
             const capacity = sprint.capacity || 30;
             const capacityPercentage = Math.min((totalPoints / capacity) * 100, 100);
             const isOverCapacity = totalPoints > capacity;

             return (
                <div 
                    key={sprint.id} 
                    className={`bg-slate-50 rounded-lg border overflow-hidden shadow-sm transition-colors ${draggedIssueId ? 'border-indigo-300 ring-2 ring-indigo-50 ring-opacity-50' : 'border-slate-200'}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, sprint.id)}
                >
                    <div className="p-4 flex items-center justify-between bg-slate-100 border-b border-slate-200">
                        <div className="flex items-center space-x-3">
                             <button onClick={() => toggleSprint(sprint.id)} className="text-slate-500 hover:text-slate-800 transition-colors">
                                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                             </button>
                             <div>
                                 <div className="flex items-center space-x-2">
                                     <h3 className="font-semibold text-slate-800">{sprint.name}</h3>
                                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                         sprint.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                                     }`}>
                                         {sprint.status}
                                     </span>
                                 </div>
                                 <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-xs text-slate-500 font-medium">{sprintIssues.length} issues • {totalPoints} pts</p>
                                    {/* Capacity Bar */}
                                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden" title={`Capacity: ${totalPoints}/${capacity}`}>
                                        <div 
                                            className={`h-full rounded-full ${isOverCapacity ? 'bg-red-500' : 'bg-green-500'}`} 
                                            style={{ width: `${capacityPercentage}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-bold ${isOverCapacity ? 'text-red-600' : 'text-slate-400'}`}>
                                        {totalPoints}/{capacity}
                                    </span>
                                 </div>
                                 {sprint.goal && <p className="text-xs text-slate-400 mt-0.5 italic">Goal: {sprint.goal}</p>}
                             </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {sprint.status === 'PLANNED' && canManageSprint && (
                                <button 
                                    onClick={() => openStartSprintModal(sprint)}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Start Sprint
                                </button>
                            )}
                            {sprint.status === 'ACTIVE' && (
                                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded uppercase tracking-wide">
                                    Active
                                </span>
                            )}
                            <button className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isCollapsed && (
                        <div className="divide-y divide-slate-100 min-h-[50px]">
                            {sprintIssues.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm border-dashed border-2 border-slate-200 m-4 rounded bg-slate-50/50">
                                    {searchQuery ? 'No issues match your search' : 'Plan a sprint by dragging issues here'}
                                </div>
                            ) : (
                                sprintIssues.map(issue => (
                                    <BacklogItem 
                                        key={issue.id} 
                                        issue={issue} 
                                        users={users} 
                                        onClick={setSelectedIssue}
                                        onDragStart={handleDragStart}
                                        onMoveToBacklog={() => updateIssue(issue.id, { sprintId: null })}
                                    />
                                ))
                            )}
                             {canCreateTask && (
                                <div className="p-2">
                                    <button className="w-full text-left p-2 text-slate-500 hover:bg-slate-100 rounded flex items-center space-x-2 text-sm transition-colors font-medium">
                                        <Plus className="w-4 h-4" />
                                        <span>Create issue</span>
                                    </button>
                                </div>
                             )}
                        </div>
                    )}
                </div>
             );
        })}

        {/* Backlog Section */}
        <div 
            className={`bg-white rounded-lg border shadow-sm transition-colors ${draggedIssueId ? 'border-indigo-300 ring-2 ring-indigo-50 ring-opacity-50' : 'border-slate-200'}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
        >
             <div className="p-4 flex items-center justify-between border-b border-slate-100">
                 <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-slate-800">Backlog</h3>
                    <span className="text-xs text-slate-400 font-medium">({backlogIssues.length} issues)</span>
                 </div>
             </div>
             <div className="divide-y divide-slate-100 min-h-[100px]">
                 {backlogIssues.length === 0 && (
                     <div className="p-8 text-center text-slate-400 text-sm">
                         {searchQuery ? 'No issues match your search' : 'Backlog is empty'}
                     </div>
                 )}
                 {backlogIssues.map(issue => (
                     <BacklogItem 
                        key={issue.id} 
                        issue={issue} 
                        users={users} 
                        onClick={setSelectedIssue} 
                        sprints={sprints}
                        onDragStart={handleDragStart}
                        onMoveToSprint={(sprintId) => updateIssue(issue.id, { sprintId })}
                    />
                 ))}
                 {canCreateTask && (
                    <div className="p-2">
                        <button className="w-full text-left p-2 text-slate-500 hover:bg-slate-50 rounded flex items-center space-x-2 text-sm transition-colors font-medium">
                            <Plus className="w-4 h-4" />
                            <span>Create issue</span>
                        </button>
                    </div>
                 )}
             </div>
        </div>
      </div>

      {/* Create Sprint Modal */}
      {showCreateSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Create Sprint</h3>
                    <button onClick={() => setShowCreateSprintModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleCreateSprint} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Name</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={`Sprint ${sprints.length + 1}`}
                            value={newSprintName}
                            onChange={(e) => setNewSprintName(e.target.value)}
                        />
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (Story Points)</label>
                        <input 
                            type="number" 
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="30"
                            value={newSprintCapacity}
                            onChange={(e) => setNewSprintCapacity(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Goal</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            placeholder="What do we want to achieve?"
                            value={newSprintGoal}
                            onChange={(e) => setNewSprintGoal(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={() => setShowCreateSprintModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                        >
                            Create Sprint
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Start Sprint Modal */}
      {showStartSprintModal && sprintToStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Start Sprint: {sprintToStart.name}</h3>
                    <button onClick={() => setShowStartSprintModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleStartSprintConfirm} className="p-6">
                     <p className="text-sm text-slate-500 mb-6">
                        {getIssuesForSprint(sprintToStart.id).length} issues will be included in this sprint.
                     </p>
                    
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                        <select 
                            value={startDuration}
                            onChange={(e) => setStartDuration(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="1">1 Week</option>
                            <option value="2">2 Weeks</option>
                            <option value="3">3 Weeks</option>
                            <option value="4">4 Weeks</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="date" 
                                    value={startStartDate}
                                    onChange={(e) => setStartStartDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="date" 
                                    value={startEndDate}
                                    disabled
                                    className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 pl-10 text-slate-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Goal</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            value={startGoal}
                            onChange={(e) => setStartGoal(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={() => setShowStartSprintModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                        >
                            Start Sprint
                        </button>
                    </div>
                </form>
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

const BacklogItem: React.FC<{
    issue: Issue; 
    users: any[]; 
    onClick: (i: Issue) => void;
    sprints?: Sprint[];
    onDragStart: (e: React.DragEvent, id: string) => void;
    onMoveToSprint?: (id: string) => void;
    onMoveToBacklog?: () => void;
}> = ({ issue, users, onClick, sprints, onDragStart, onMoveToSprint, onMoveToBacklog }) => {
    const assignee = users.find(u => u.id === issue.assigneeId);
    
    return (
        <div 
            className="group flex items-center justify-between p-3 hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing bg-white"
            draggable
            onDragStart={(e) => onDragStart(e, issue.id)}
        >
            <div className="flex items-center space-x-3 flex-1 min-w-0" onClick={() => onClick(issue)}>
                <div className="cursor-grab text-slate-300 hover:text-slate-500">
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className={`p-1.5 rounded ${
                    issue.type === IssueType.BUG ? 'bg-red-100 text-red-600' :
                    issue.type === IssueType.STORY ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                    {/* Simple icons based on type */}
                    <div className="w-2.5 h-2.5 bg-current rounded-sm" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="text-slate-500 text-xs font-mono">{issue.id}</span>
                        <p className="text-sm text-slate-800 truncate font-medium group-hover:text-indigo-600 transition-colors">{issue.title}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4 pl-4" onClick={(e) => e.stopPropagation()}>
                {issue.epicId && (
                     <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        Epic
                     </span>
                )}
                
                <div className="flex items-center space-x-1" title={`Priority: ${issue.priority}`}>
                    <span className={`w-2 h-2 rounded-full ${
                        issue.priority === Priority.CRITICAL ? 'bg-red-500' : 
                        issue.priority === Priority.HIGH ? 'bg-orange-500' :
                        issue.priority === Priority.MEDIUM ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                </div>

                {issue.storyPoints !== undefined && (
                    <div className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full min-w-[24px] text-center border border-slate-200">
                        {issue.storyPoints}
                    </div>
                )}

                {assignee ? (
                    <img src={assignee.avatar} className="w-6 h-6 rounded-full border border-white shadow-sm" title={assignee.name} alt="" />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">?</div>
                )}

                <div className="relative group/actions">
                     <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                     </button>
                     {/* Quick Actions Dropdown */}
                     <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-lg hidden group-hover/actions:block z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                         {sprints && onMoveToSprint && (
                             <>
                                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Move to Sprint</div>
                                {sprints.filter(s => s.status !== 'COMPLETED').map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => onMoveToSprint(s.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                    >
                                        {s.name}
                                    </button>
                                ))}
                             </>
                         )}
                         {onMoveToBacklog && (
                             <button 
                                onClick={onMoveToBacklog}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                            >
                                Move to Backlog
                            </button>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};
