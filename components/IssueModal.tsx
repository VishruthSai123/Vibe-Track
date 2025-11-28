import React, { useState, useEffect, useRef } from 'react';
import { Issue, Priority, Status, IssueType, User } from '../types';
import { useProject } from '../store/ProjectContext';
import { X, Bot, Paperclip, Send, Trash2, Calendar, User as UserIcon, CheckSquare, Plus, FileText, Download, Upload, Loader2 } from 'lucide-react';
import { generateIssueDescription, suggestSubtasks, summarizeIssue } from '../services/geminiService';

interface IssueModalProps {
  issue: Issue;
  onClose: () => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({ issue, onClose }) => {
  const { updateIssue, users, addComment, deleteIssue, sprints, epics, currentUser, uploadAttachment, showToast } = useProject();
  const [description, setDescription] = useState(issue.description);
  const [title, setTitle] = useState(issue.title);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiSummary, setAiSummary] = useState(issue.summary || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if issue prop changes
  useEffect(() => {
    setDescription(issue.description);
    setTitle(issue.title);
    setAiSummary(issue.summary || '');
  }, [issue]);

  const handleSave = () => {
    updateIssue(issue.id, { title, description, summary: aiSummary });
  };

  const handleGenerateDescription = async () => {
    if (!title) return;
    setIsAiGenerating(true);
    try {
      const generated = await generateIssueDescription(title, issue.type);
      setDescription(prev => prev ? prev + '\n\n' + generated : generated);
    } catch (e) {
      showToast("Failed to generate description. Check API Key.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSuggestSubtasks = async () => {
    if (!description) return;
    setIsAiGenerating(true);
    try {
      const tasks = await suggestSubtasks(description);
      const newSubtasks = tasks.map((t, i) => ({
          id: `st-${Date.now()}-${i}`,
          title: t,
          completed: false
      }));
      updateIssue(issue.id, { subtasks: [...issue.subtasks, ...newSubtasks] });
    } catch (e) {
        console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };
  
  const handleSummarize = async () => {
      setIsAiGenerating(true);
      try {
          const content = `Title: ${title}\nDescription: ${description}\nComments: ${issue.comments.map(c => c.text).join(' | ')}`;
          const summary = await summarizeIssue(content);
          setAiSummary(summary);
          updateIssue(issue.id, { summary });
      } catch (e) {
          console.error(e);
      } finally {
          setIsAiGenerating(false);
      }
  };

  const handleDelete = () => {
      if(window.confirm('Are you sure you want to delete this issue?')) {
          deleteIssue(issue.id);
          onClose();
      }
  };

  const submitComment = () => {
      if(!newComment.trim() || !currentUser) return;
      addComment(issue.id, newComment, currentUser.id);
      setNewComment('');
  };

  const addSubtask = () => {
      if(!newSubtask.trim()) return;
      const subtask = {
          id: `st-${Date.now()}`,
          title: newSubtask,
          completed: false
      };
      updateIssue(issue.id, { subtasks: [...issue.subtasks, subtask] });
      setNewSubtask('');
  };

  const toggleSubtask = (subtaskId: string, completed: boolean) => {
      const updatedSubtasks = issue.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed } : st
      );
      updateIssue(issue.id, { subtasks: updatedSubtasks });
  };

  const deleteSubtask = (subtaskId: string) => {
      const updatedSubtasks = issue.subtasks.filter(st => st.id !== subtaskId);
      updateIssue(issue.id, { subtasks: updatedSubtasks });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      try {
          const publicUrl = await uploadAttachment(file);
          const attachment = {
              id: `att-${Date.now()}`,
              name: file.name,
              type: file.type.split('/')[1] || 'file',
              url: publicUrl
          };
          updateIssue(issue.id, { attachments: [...issue.attachments, attachment] });
          showToast("File uploaded successfully", "success");
      } catch (error) {
          console.error("Upload failed", error);
          // Toast handled in context
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const removeAttachment = (attId: string) => {
      if(window.confirm('Remove attachment?')) {
        updateIssue(issue.id, { attachments: issue.attachments.filter(a => a.id !== attId) });
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fade-in-up">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full border-r border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div className="flex-1 mr-4">
                     <div className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                        <span>{issue.id}</span>
                        <span>/</span>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleSave}
                            className="bg-transparent hover:bg-slate-100 rounded px-1 -ml-1 flex-1 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                     <h2 className="text-2xl font-semibold text-slate-900 leading-tight">
                        {title}
                     </h2>
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {/* AI Banner if summary exists */}
                {aiSummary && (
                    <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start space-x-3">
                        <Bot className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">AI Summary</h5>
                            <p className="text-sm text-indigo-900 leading-relaxed">{aiSummary}</p>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-slate-900">Description</h3>
                        <div className="flex space-x-2">
                             <button 
                                onClick={handleGenerateDescription}
                                disabled={isAiGenerating}
                                className="text-xs flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded transition-colors"
                            >
                                <Bot className="w-3 h-3" />
                                <span>{isAiGenerating ? 'Thinking...' : 'AI Write'}</span>
                            </button>
                             <button 
                                onClick={handleSummarize}
                                disabled={isAiGenerating}
                                className="text-xs flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded transition-colors"
                            >
                                <Bot className="w-3 h-3" />
                                <span>Summarize</span>
                            </button>
                        </div>
                    </div>
                    <textarea 
                        className="w-full h-48 p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm leading-relaxed resize-none font-mono"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleSave}
                        placeholder="Add a description..."
                    />
                </div>

                {/* Subtasks Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-slate-900">Subtasks</h3>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                {issue.subtasks.filter(t => t.completed).length}/{issue.subtasks.length}
                            </span>
                             <button 
                                onClick={handleSuggestSubtasks}
                                disabled={isAiGenerating}
                                className="text-xs flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors"
                            >
                                <Bot className="w-3 h-3" />
                                <span>Suggest</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                        {issue.subtasks.map(subtask => (
                            <div key={subtask.id} className="group flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <button 
                                    onClick={() => toggleSubtask(subtask.id, !subtask.completed)}
                                    className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                        subtask.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent hover:border-indigo-500'
                                    }`}
                                >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                </button>
                                <span className={`flex-1 text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {subtask.title}
                                </span>
                                <button 
                                    onClick={() => deleteSubtask(subtask.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Plus className="w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                            placeholder="Add a subtask..."
                            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Comments Section */}
                <div>
                     <h3 className="font-medium text-slate-900 mb-4">Activity</h3>
                     <div className="flex items-start space-x-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            ME
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <textarea 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full border border-slate-200 rounded-lg p-3 pr-10 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                    rows={1}
                                />
                                <button 
                                    onClick={submitComment}
                                    disabled={!newComment.trim()}
                                    className="absolute right-2 bottom-2 p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        {issue.comments.map(comment => {
                             const author = users.find(u => u.id === comment.userId);
                             return (
                                <div key={comment.id} className="flex space-x-3">
                                    <img src={author?.avatar} className="w-8 h-8 rounded-full" alt="" />
                                    <div>
                                        <div className="flex items-center space-x-2 mb-0.5">
                                            <span className="text-sm font-semibold text-slate-900">{author?.name || 'Unknown'}</span>
                                            <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-700">{comment.text}</p>
                                    </div>
                                </div>
                             );
                        })}
                     </div>
                </div>
            </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-slate-50/50 p-6 overflow-y-auto h-full border-l border-slate-100">
             
             <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                <select 
                    value={issue.status}
                    onChange={(e) => updateIssue(issue.id, { status: e.target.value as Status })}
                    className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                    {Object.values(Status).map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                </select>
             </div>

             <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignee</label>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer transition-colors group">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                    <select 
                        value={issue.assigneeId || ''}
                        onChange={(e) => updateIssue(issue.id, { assigneeId: e.target.value })}
                        className="bg-transparent w-full text-sm text-slate-700 focus:outline-none cursor-pointer"
                    >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
             </div>

             <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                 <select 
                    value={issue.priority}
                    onChange={(e) => updateIssue(issue.id, { priority: e.target.value as Priority })}
                    className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                    {Object.values(Priority).map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
             </div>
             
             <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Details</label>
                <div className="space-y-3">
                    <div className="flex items-center justify-between group">
                        <span className="text-sm text-slate-500">Story Points</span>
                        <input 
                            type="number"
                            value={issue.storyPoints || 0}
                            onChange={(e) => updateIssue(issue.id, { storyPoints: parseInt(e.target.value) || 0 })}
                            className="w-16 bg-transparent text-right text-sm border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                     <div className="flex items-center justify-between group">
                        <span className="text-sm text-slate-500">Sprint</span>
                        <select 
                             value={issue.sprintId || ''}
                             onChange={(e) => updateIssue(issue.id, { sprintId: e.target.value || null })}
                             className="text-right text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none max-w-[150px] truncate"
                        >
                            <option value="">Backlog</option>
                            {sprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-between group">
                        <span className="text-sm text-slate-500">Epic</span>
                        <select 
                             value={issue.epicId || ''}
                             onChange={(e) => updateIssue(issue.id, { epicId: e.target.value })}
                             className="text-right text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none max-w-[150px] truncate"
                        >
                            <option value="">None</option>
                            {epics.map(e => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
             </div>

             <div className="mb-6">
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dates</label>
                 <div className="text-sm text-slate-600 space-y-2">
                    <div className="flex justify-between">
                        <span>Created</span>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Updated</span>
                        <span>{new Date(issue.updatedAt).toLocaleDateString()}</span>
                    </div>
                 </div>
             </div>

             <div className="border-t border-slate-200 pt-6 mt-6">
                 <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Attachments</label>
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.txt"
                    />
                 </div>
                 
                 <div className="space-y-2">
                     {issue.attachments.length === 0 && <span className="text-xs text-slate-400 italic">No attachments</span>}
                     {issue.attachments.map(att => (
                         <div key={att.id} className="flex items-center space-x-2 p-2 bg-slate-100 rounded group relative">
                             {att.type.includes('image') ? (
                                 <img src={att.url} className="w-8 h-8 object-cover rounded" alt="attachment" />
                             ) : (
                                <div className="p-1 bg-white rounded shadow-sm">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                </div>
                             )}
                             <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-700 flex-1 truncate hover:underline">{att.name}</a>
                             <button onClick={() => removeAttachment(att.id)} className="p-1 text-slate-400 hover:text-red-600">
                                 <X className="w-3 h-3" />
                             </button>
                         </div>
                     ))}
                 </div>
             </div>

        </div>

      </div>
    </div>
  );
};