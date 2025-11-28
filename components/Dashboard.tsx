import React from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Status, Priority } from '../types';
import { CheckCircle, Clock, TrendingUp, AlertCircle, Layout, User } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { issues, activeSprint, sprints, users, activeProject } = useProject();

  // --- Active Sprint Calculations ---
  const activeSprintIssues = activeSprint 
    ? issues.filter(i => i.sprintId === activeSprint.id) 
    : [];
  
  const totalPoints = activeSprintIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const completedPoints = activeSprintIssues
    .filter(i => i.status === Status.DONE)
    .reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  
  const progressPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  
  // Calculate Days Remaining
  const daysRemaining = activeSprint?.endDate 
    ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // --- Velocity Data (Historical) ---
  const completedSprints = sprints.filter(s => s.status === 'COMPLETED');
  const velocityData = completedSprints.map(s => {
    const sprintIssues = issues.filter(i => i.sprintId === s.id);
    const points = sprintIssues
      .filter(i => i.status === Status.DONE)
      .reduce((acc, i) => acc + (i.storyPoints || 0), 0);
    return {
      name: s.name.split(':')[0], // Short name
      points: points
    };
  });

  // --- Burndown Data (Mock Simulation based on Active Sprint) ---
  const generateBurndownData = () => {
    if (!activeSprint) return [];
    const data = [];
    const totalDays = 14; // Assuming 2 week sprint for visualisation
    const pointsPerDay = totalPoints / totalDays;
    
    // Ideal line
    for (let i = 0; i <= totalDays; i++) {
       // Mock "Actual" line: trending slightly above ideal then converging
       let actual = null;
       const currentDay = 7; // Pretend we are on day 7
       if (i <= currentDay) {
           // Simulate a slow start
           actual = totalPoints - (i * pointsPerDay * 0.8);
       }

       data.push({
           day: `Day ${i}`,
           Ideal: Math.max(0, totalPoints - (i * pointsPerDay)),
           Actual: actual,
       });
    }
    return data;
  };
  const burndownData = generateBurndownData();

  // --- Workload Data ---
  const workloadData = users.map(u => {
      const userIssues = activeSprintIssues.filter(i => i.assigneeId === u.id);
      return {
          name: u.name.split(' ')[0], // First name
          points: userIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0),
          count: userIssues.length
      };
  });

  // --- Status Distribution ---
  const statusData = Object.values(Status).map(status => ({
    name: status.replace('_', ' '),
    value: issues.filter(i => i.status === status).length
  }));

  const STATUS_COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

  if (!activeProject) return <div>Select a project</div>;

  return (
    <div className="p-4 md:p-8 overflow-y-auto h-full bg-slate-50 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of {activeProject.name} velocity and progress</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto text-center">
             Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Sprint Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2 relative overflow-hidden">
             {activeSprint ? (
                 <>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-bold text-slate-800">{activeSprint.name}</h3>
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Active</span>
                            </div>
                            <p className="text-sm text-slate-500">{activeSprint.goal}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-2xl font-bold text-indigo-600">{daysRemaining}</span>
                            <span className="text-xs text-slate-400 uppercase font-semibold">Days Left</span>
                        </div>
                    </div>
                    
                    <div className="mb-2 flex justify-between text-sm font-medium">
                        <span className="text-slate-600">{completedPoints} of {totalPoints} points</span>
                        <span className="text-indigo-600">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                 </>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-4">
                     <Layout className="w-10 h-10 text-slate-300 mb-2" />
                     <h3 className="font-semibold text-slate-600">No Active Sprint</h3>
                     <p className="text-sm text-slate-400">Start a sprint in the Backlog to see progress.</p>
                 </div>
             )}
        </div>

        {/* Velocity Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-slate-700">Avg Velocity</h3>
                 <TrendingUp className="w-5 h-5 text-emerald-500" />
             </div>
             <div className="flex items-baseline space-x-2">
                 <span className="text-3xl font-bold text-slate-800">
                     {Math.round(velocityData.reduce((acc, v) => acc + v.points, 0) / (velocityData.length || 1))}
                 </span>
                 <span className="text-sm text-slate-500">points / sprint</span>
             </div>
             <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" />
                 +12% from last month
             </p>
        </div>

        {/* Issues Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-slate-700">Open Issues</h3>
                 <AlertCircle className="w-5 h-5 text-orange-500" />
             </div>
             <div className="flex items-baseline space-x-2">
                 <span className="text-3xl font-bold text-slate-800">
                     {issues.filter(i => i.status !== Status.DONE).length}
                 </span>
                 <span className="text-sm text-slate-500">total</span>
             </div>
              <div className="mt-4 flex space-x-2 flex-wrap gap-2">
                  <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                      {issues.filter(i => i.priority === Priority.CRITICAL && i.status !== Status.DONE).length} Critical
                  </span>
                  <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                      {issues.filter(i => i.priority === Priority.HIGH && i.status !== Status.DONE).length} High
                  </span>
              </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
        {/* Burndown Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Sprint Burndown</h3>
            <div className="h-64 md:h-72">
                 {activeSprint ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={burndownData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            />
                            <Legend />
                            <Area type="monotone" dataKey="Actual" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                            <Area type="monotone" dataKey="Ideal" stroke="#94a3b8" strokeDasharray="5 5" fill="none" />
                        </AreaChart>
                     </ResponsiveContainer>
                 ) : (
                     <div className="h-full flex items-center justify-center text-slate-400">
                         No active sprint data available
                     </div>
                 )}
            </div>
        </div>

        {/* Status Breakdown Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Overall Status</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Velocity Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-6">Sprint Velocity</h3>
               <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="points" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                   </ResponsiveContainer>
               </div>
          </div>

          {/* Workload Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-6">Active Workload</h3>
               <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 13, fontWeight: 500, fill: '#334155'}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} />
                            <Bar dataKey="points" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} name="Story Points" />
                        </BarChart>
                   </ResponsiveContainer>
               </div>
          </div>
      </div>
    </div>
  );
};