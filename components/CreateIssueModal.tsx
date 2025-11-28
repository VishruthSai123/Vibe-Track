import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { IssueType, Priority, Status } from '../types';
import { X, Bot } from 'lucide-react';
import { generateIssueDescription } from '../services/geminiService';

interface CreateIssueModalProps {
  onClose: () => void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ onClose }) => {
  const { addIssue, users, sprints, epics, currentUser } = useProject();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>(IssueType.STORY);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [epicId, setEpicId] = useState('');
  const [storyPoints, setStoryPoints] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    addIssue({
      title,
      description,
      type,
      priority,
      status: Status.TODO,
      assigneeId: assigneeId || undefined,
      reporterId: currentUser.id,
      sprintId: sprintId || null,
      epicId: epicId || undefined,
      storyPoints: storyPoints || undefined
    });
    onClose();
  };

  const handleAIDescription = async () => {
      if(!title) return;
      setIsGenerating(true);
      try {
          const desc = await generateIssueDescription(title, type);
          setDescription(desc);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Create Issue</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as IssueType)}
                className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Object.values(IssueType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What needs to be done?"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <button 
                    type="button" 
                    onClick={handleAIDescription}
                    disabled={isGenerating || !title}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 disabled:opacity-50"
                  >
                      <Bot className="w-3 h-3" />
                      <span>{isGenerating ? 'Generating...' : 'Auto-Write with AI'}</span>
                  </button>
              </div>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-md shadow-sm p-2 h-32 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the issue in detail..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select 
                        value={priority} 
                        onChange={e => setPriority(e.target.value as Priority)}
                        className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                    <select 
                        value={assigneeId} 
                        onChange={e => setAssigneeId(e.target.value)}
                        className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sprint</label>
                    <select 
                        value={sprintId} 
                        onChange={e => setSprintId(e.target.value)}
                        className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Backlog</option>
                        {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Epic</label>
                    <select 
                        value={epicId} 
                        onChange={e => setEpicId(e.target.value)}
                        className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">None</option>
                        {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Story Points</label>
                    <input 
                        type="number"
                        min="0"
                        value={storyPoints} 
                        onChange={e => setStoryPoints(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">Create Issue</button>
          </div>
        </form>
      </div>
    </div>
  );
};