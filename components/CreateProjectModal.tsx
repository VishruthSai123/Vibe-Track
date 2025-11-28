
import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Project } from '../types';
import { X, FolderPlus } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose }) => {
  const { createProject } = useProject();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Project['type']>('software');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject(name, key.toUpperCase(), description, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Create Project</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Mobile App"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key (Prefix)</label>
              <input 
                type="text" 
                required
                maxLength={5}
                value={key}
                onChange={e => setKey(e.target.value)}
                className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                placeholder="e.g. MOB"
              />
            </div>
            
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as any)}
                className="w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                  <option value="software">Software Development</option>
                  <option value="marketing">Marketing Campaign</option>
                  <option value="business">Business Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-md shadow-sm p-2 h-20 resize-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief description of the project..."
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">Create Project</button>
          </div>
        </form>
      </div>
    </div>
  );
};
