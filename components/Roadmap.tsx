import React from 'react';
import { useProject } from '../store/ProjectContext';
import { Calendar } from 'lucide-react';

export const Roadmap: React.FC = () => {
  const { epics, activeProject } = useProject();

  // Simple timeline calculation
  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const totalDays = 90; // View range
  
  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffTime = date.getTime() - startMonth.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays / totalDays) * 100;
  };

  const getWidth = (startStr: string, endStr: string) => {
      const start = getPosition(startStr);
      const end = getPosition(endStr);
      return Math.max(end - start, 2); // Minimum 2% width
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = today.getMonth();
  const visibleMonths = [
      months[(currentMonthIdx - 1 + 12) % 12],
      months[currentMonthIdx],
      months[(currentMonthIdx + 1) % 12]
  ];

  if (!activeProject) return <div>Select a project</div>;

  return (
    <div className="h-full bg-white p-4 md:p-8 overflow-y-auto">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 md:mb-8">Roadmap</h1>
        <p className="text-sm text-slate-500 mb-4">{activeProject.name} Epics Timeline</p>
        
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
            <div className="min-w-[600px]"> {/* Ensure minimum width for timeline */}
                {/* Timeline Header */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <div className="w-48 p-4 font-semibold text-slate-600 text-sm border-r border-slate-200">
                        Epic
                    </div>
                    <div className="flex-1 flex">
                        {visibleMonths.map((m, i) => (
                            <div key={i} className="flex-1 p-4 text-sm font-medium text-slate-500 border-r border-slate-200 last:border-r-0">
                                {m} {today.getFullYear()}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Epics Rows */}
                <div className="bg-white">
                    {epics.map(epic => (
                        <div key={epic.id} className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50 group">
                            <div className="w-48 p-4 border-r border-slate-200 z-10 bg-white group-hover:bg-slate-50">
                                <h4 className="font-medium text-slate-800 text-sm">{epic.title}</h4>
                                <p className="text-xs text-slate-500 truncate mt-1">{epic.description}</p>
                            </div>
                            <div className="flex-1 relative h-16 bg-slate-50/30">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex">
                                    <div className="flex-1 border-r border-dashed border-slate-200"></div>
                                    <div className="flex-1 border-r border-dashed border-slate-200"></div>
                                    <div className="flex-1"></div>
                                </div>

                                {/* Epic Bar */}
                                <div 
                                    className={`absolute h-8 top-4 rounded-md shadow-sm ${epic.color} opacity-90 hover:opacity-100 cursor-pointer transition-all`}
                                    style={{
                                        left: `${Math.max(0, getPosition(epic.startDate))}%`,
                                        width: `${Math.min(100 - getPosition(epic.startDate), getWidth(epic.startDate, epic.endDate))}%`
                                    }}
                                >
                                    <div className="px-3 h-full flex items-center text-white text-xs font-semibold truncate">
                                        {epic.title}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                 {epics.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No epics defined for this project yet.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};