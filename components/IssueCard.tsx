import React from 'react';
import { Issue, IssueType, Priority, User } from '../types';
import { AlertCircle, CheckSquare, Bookmark, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useProject } from '../store/ProjectContext';

interface IssueCardProps {
  issue: Issue;
  users: User[];
  onClick: (issue: Issue) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, issueId: string) => void;
}

const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case Priority.CRITICAL: return <ArrowUp className="w-3.5 h-3.5 text-red-600" strokeWidth={3} />;
    case Priority.HIGH: return <ArrowUp className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.5} />;
    case Priority.MEDIUM: return <Minus className="w-3.5 h-3.5 text-yellow-500" strokeWidth={2.5} />;
    case Priority.LOW: return <ArrowDown className="w-3.5 h-3.5 text-slate-400" />;
  }
};

const getTypeIcon = (type: IssueType) => {
  switch (type) {
    case IssueType.BUG: return <div className="p-1 bg-red-100 rounded-md"><AlertCircle className="w-3 h-3 text-red-600" /></div>;
    case IssueType.STORY: return <div className="p-1 bg-green-100 rounded-md"><Bookmark className="w-3 h-3 text-green-600" /></div>;
    case IssueType.TASK: return <div className="p-1 bg-blue-100 rounded-md"><CheckSquare className="w-3 h-3 text-blue-600" /></div>;
  }
};

export const IssueCard: React.FC<IssueCardProps> = ({ issue, users, onClick, onDragStart }) => {
  const { epics } = useProject();
  const assignee = users.find(u => u.id === issue.assigneeId);
  const epic = epics.find(e => e.id === issue.epicId);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issue.id)}
      onClick={() => onClick(issue)}
      className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group relative select-none"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
           <span className="text-[10px] text-slate-500 font-mono font-medium opacity-75">{issue.id}</span>
        </div>
      </div>
      
      <div className="flex gap-2 items-start mb-3">
          <div className="mt-0.5">{getTypeIcon(issue.type)}</div>
          <h4 className="text-sm font-medium text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-3">
            {issue.title}
          </h4>
      </div>

      {/* Tags Row */}
      {epic && (
          <div className="mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold text-white tracking-wide shadow-sm inline-block max-w-full truncate ${epic.color}`}>
                  {epic.title}
              </span>
          </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-2">
        <div className="flex items-center space-x-2" title={`Priority: ${issue.priority}`}>
          {getPriorityIcon(issue.priority)}
          {issue.storyPoints !== undefined && (
              <div className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 min-w-[20px] text-center" title="Story Points">
                  {issue.storyPoints}
              </div>
          )}
        </div>
        
        {assignee ? (
          <img 
            src={assignee.avatar} 
            alt={assignee.name} 
            className="w-5 h-5 rounded-full border border-white shadow-sm ring-1 ring-slate-100"
            title={assignee.name}
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center text-[9px] text-slate-400">
            ?
          </div>
        )}
      </div>
    </div>
  );
};