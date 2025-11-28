import React, { useState } from 'react';
import { ProjectProvider, useProject } from './store/ProjectContext';
import { Board } from './components/Board';
import { Backlog } from './components/Backlog';
import { Roadmap } from './components/Roadmap';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';
import { CreateIssueModal } from './components/CreateIssueModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { Auth } from './components/Auth';
import { Teams } from './components/Teams';
import { LayoutDashboard, Kanban, Plus, Settings as SettingsIcon, Search, Bell, HelpCircle, ListTodo, Map, Users, LogOut, ChevronDown, FolderPlus, Layers, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Permission } from './types';

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useProject();
    
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id}
                    className="pointer-events-auto bg-white rounded-lg shadow-lg border border-slate-100 p-4 flex items-center gap-3 min-w-[300px] animate-slide-in-right"
                >
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                    
                    <p className="flex-1 text-sm text-slate-700 font-medium">{toast.message}</p>
                    
                    <button 
                        onClick={() => removeToast(toast.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

const SidebarItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    active?: boolean; 
    onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
    <div 
        onClick={onClick}
        className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 group
        ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
    >
        <div className={`transition-colors duration-200 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
            {icon}
        </div>
        <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
    </div>
);

type ViewType = 'board' | 'backlog' | 'roadmap' | 'dashboard' | 'settings' | 'profile' | 'teams';

const AppContent: React.FC = () => {
    const { 
        currentUser, activeProject, activeWorkspace, projects, setActiveProject, 
        isAuthenticated, logout, searchQuery, setSearchQuery, notifications, 
        markNotificationRead, clearNotifications, checkPermission
    } = useProject();

    const [currentView, setCurrentView] = useState<ViewType>('board');
    const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

    if (!isAuthenticated) {
        return <Auth />;
    }

    // Guard: If logged in but no data (edge case)
    if (!activeWorkspace || !activeProject) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading workspace...</p>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    const canCreateProject = checkPermission(Permission.CREATE_PROJECT);

    const renderView = () => {
        switch (currentView) {
            case 'board': return <Board />;
            case 'backlog': return <Backlog />;
            case 'roadmap': return <Roadmap />;
            case 'dashboard': return <Dashboard />;
            case 'teams': return <Teams />;
            case 'settings': return <Settings />;
            case 'profile': return <Profile />;
            default: return <Board />;
        }
    };

    return (
        <div className="flex h-screen bg-white">
            <ToastContainer />
            
            {/* Workspace Rail (Leftmost) */}
            <div className="w-16 bg-slate-900 flex flex-col items-center py-6 space-y-4 flex-shrink-0 z-30">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 cursor-pointer hover:bg-indigo-500 transition-colors transform hover:scale-105 active:scale-95 duration-200">
                    <span className="text-white font-bold text-lg select-none">{activeWorkspace.name[0]}</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-700 rounded-full" />
                
                {/* Only Founders can see Add Project */}
                {canCreateProject && (
                    <div 
                        onClick={() => setIsCreateProjectOpen(true)}
                        className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
                        title="Add Project"
                    >
                        <Plus className="w-6 h-6" />
                    </div>
                )}
                
                <div className="flex-1" />
                <button onClick={logout} className="p-2 text-slate-500 hover:text-slate-300 transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Sidebar (Project Nav) */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
                {/* Project Selector */}
                <div className="p-4 border-b border-slate-200/50">
                    <div className="relative">
                        <button 
                            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                            className="w-full flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm"
                        >
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                                    {activeProject.key[0]}
                                </div>
                                <div className="text-left min-w-0">
                                    <h3 className="text-sm font-bold text-slate-800 truncate">{activeProject.name}</h3>
                                    <p className="text-xs text-slate-500 truncate">{activeProject.type} project</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {isProjectMenuOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-up">
                                <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Project</div>
                                {projects.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setActiveProject(p.id); setIsProjectMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${p.id === activeProject.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <span>{p.name}</span>
                                        {p.id === activeProject.id && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                                    </button>
                                ))}
                                {canCreateProject && (
                                    <button 
                                        onClick={() => { setIsCreateProjectOpen(true); setIsProjectMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium border-t border-slate-100 flex items-center space-x-2"
                                    >
                                        <FolderPlus className="w-4 h-4" />
                                        <span>Create Project</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 py-4">
                    <button 
                        onClick={() => setIsCreateIssueOpen(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-md hover:shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2 font-medium text-sm transform active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Issue</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">
                            Planning
                    </div>
                    <SidebarItem 
                        icon={<Map className="w-5 h-5" />} 
                        label="Roadmap" 
                        active={currentView === 'roadmap'}
                        onClick={() => setCurrentView('roadmap')}
                    />
                    <SidebarItem 
                        icon={<ListTodo className="w-5 h-5" />} 
                        label="Backlog" 
                        active={currentView === 'backlog'}
                        onClick={() => setCurrentView('backlog')}
                    />
                     <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">
                            Development
                    </div>
                    <SidebarItem 
                        icon={<Kanban className="w-5 h-5" />} 
                        label="Active Board" 
                        active={currentView === 'board'}
                        onClick={() => setCurrentView('board')}
                    />
                    <SidebarItem 
                        icon={<LayoutDashboard className="w-5 h-5" />} 
                        label="Reports" 
                        active={currentView === 'dashboard'}
                        onClick={() => setCurrentView('dashboard')}
                    />
                     <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">
                            Organization
                    </div>
                    <SidebarItem 
                        icon={<Users className="w-5 h-5" />} 
                        label="Teams" 
                        active={currentView === 'teams'}
                        onClick={() => setCurrentView('teams')}
                    />
                     
                     <div className="pt-4 mt-4 border-t border-slate-200">
                        <SidebarItem 
                            icon={<SettingsIcon className="w-5 h-5" />} 
                            label="Project Settings" 
                            active={currentView === 'settings'}
                            onClick={() => setCurrentView('settings')} 
                        />
                     </div>
                </nav>

                <div className="p-4 border-t border-slate-200 bg-white">
                     <div 
                        onClick={() => setCurrentView('profile')}
                        className={`flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${currentView === 'profile' ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-100 border border-transparent'}`}
                    >
                        <img src={currentUser?.avatar} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" alt="Avatar" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{currentUser?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{currentUser?.role}</p>
                        </div>
                     </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-20 relative shadow-sm">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${activeProject.name}...`} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-slate-100 focus:bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className={`text-slate-400 hover:text-slate-600 relative p-2 rounded-full hover:bg-slate-100 transition-all ${isNotifOpen ? 'bg-slate-100 text-indigo-600' : ''}`}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up origin-top-right z-50">
                                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
                                        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                                        <button onClick={clearNotifications} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Clear all</button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
                                                <Bell className="w-8 h-8 text-slate-200 mb-2" />
                                                No new notifications
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => markNotificationRead(n.id)}
                                                    className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-indigo-50/30' : ''}`}
                                                >
                                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* View Area */}
                <main className="flex-1 bg-slate-50 overflow-hidden relative">
                    {renderView()}
                </main>
            </div>

            {isCreateIssueOpen && <CreateIssueModal onClose={() => setIsCreateIssueOpen(false)} />}
            {isCreateProjectOpen && <CreateProjectModal onClose={() => setIsCreateProjectOpen(false)} />}
        </div>
    );
};

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;