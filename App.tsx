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
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal';
import { Auth } from './components/Auth';
import { Teams } from './components/Teams';
import { LayoutDashboard, Kanban, Plus, Settings as SettingsIcon, Search, Bell, HelpCircle, ListTodo, Map, Users, LogOut, ChevronDown, FolderPlus, Layers, X, CheckCircle, AlertCircle, Info, Menu, Loader2 } from 'lucide-react';
import { Permission } from './types';

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useProject();
    
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-3rem)]">
            {toasts.map(toast => (
                <div 
                    key={toast.id}
                    className="pointer-events-auto bg-white rounded-lg shadow-xl border border-slate-100 p-4 flex items-center gap-3 min-w-[320px] animate-slide-in-right transform transition-all duration-300 hover:scale-[1.02]"
                >
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                    {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                    
                    <p className="flex-1 text-sm text-slate-700 font-medium break-words leading-tight">{toast.message}</p>
                    
                    <button 
                        onClick={() => removeToast(toast.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 p-1 hover:bg-slate-50 rounded"
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
        currentUser, activeProject, activeWorkspace, workspaces, setActiveWorkspace, projects, setActiveProject, 
        isAuthenticated, logout, searchQuery, setSearchQuery, notifications, 
        markNotificationRead, clearNotifications, checkPermission, isLoading
    } = useProject();

    const [currentView, setCurrentView] = useState<ViewType>('board');
    const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Initializing VibeTrack...</p>
            </div>
        );
    }

    // 2. Auth Check
    if (!isAuthenticated) {
        return <Auth />;
    }

    // 3. Empty State (Logged in but no Workspace/Project)
    // Note: With multi-workspace, user might have workspace but no project. 
    // If no workspace at all, allow creating one.
    if (!activeWorkspace) {
         return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <ToastContainer />
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Layers className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">No Workspace Found</h2>
                    <p className="text-slate-500 mb-8">
                        You aren't a member of any workspace yet. {checkPermission(Permission.CREATE_WORKSPACE) ? 'Create your first workspace to get started.' : 'Ask your admin to invite you.'}
                    </p>
                    <div className="space-y-3">
                        {checkPermission(Permission.CREATE_WORKSPACE) && (
                            <button 
                                onClick={() => setIsCreateWorkspaceOpen(true)}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98]"
                            >
                                Create Workspace
                            </button>
                        )}
                        <button 
                            onClick={logout}
                            className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
                {isCreateWorkspaceOpen && <CreateWorkspaceModal onClose={() => setIsCreateWorkspaceOpen(false)} />}
            </div>
        );
    }

    // Handle case where workspace exists but no project selected (or exists)
    if (!activeProject) {
         // We render the layout but maybe overlay a "Create Project" prompt in main area
         // However, keeping standard layout allows sidebar navigation to switch workspaces
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    const canCreateProject = checkPermission(Permission.CREATE_PROJECT);
    const canCreateWorkspace = checkPermission(Permission.CREATE_WORKSPACE);

    const handleViewChange = (view: ViewType) => {
        setCurrentView(view);
        setIsMobileMenuOpen(false); // Close sidebar on mobile when navigating
    };

    const renderView = () => {
        if (!activeProject) {
             return (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
                    <FolderPlus className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">No Project Selected</h2>
                    <p className="text-slate-500 mb-6 max-w-md">Select a project from the sidebar menu or create a new one to start tracking work.</p>
                    {canCreateProject && (
                        <button 
                            onClick={() => setIsCreateProjectOpen(true)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-all"
                        >
                            Create New Project
                        </button>
                    )}
                </div>
             );
        }

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
        <div className="flex h-screen bg-white overflow-hidden relative">
            <ToastContainer />
            
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Container - Responsive */}
            <div className={`
                fixed inset-y-0 left-0 z-50 flex h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 md:shadow-none md:z-auto flex-shrink-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                
                {/* Workspace Rail (Leftmost) - Dynamic Switcher */}
                <div className="w-16 bg-slate-900 flex flex-col items-center py-6 space-y-4 flex-shrink-0 z-30 h-full overflow-y-auto custom-scrollbar no-scrollbar">
                    {workspaces.map(ws => (
                        <div 
                            key={ws.id}
                            onClick={() => setActiveWorkspace(ws.id)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 group relative
                            ${activeWorkspace.id === ws.id 
                                ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                            title={ws.name}
                        >
                            <span className="font-bold text-lg select-none uppercase">{ws.name.substring(0, 2)}</span>
                            
                            {/* Active Indicator */}
                            {activeWorkspace.id === ws.id && (
                                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                            )}
                        </div>
                    ))}
                    
                    <div className="w-8 h-0.5 bg-slate-700 rounded-full my-2 opacity-50" />
                    
                    {/* Add Workspace Button */}
                    {canCreateWorkspace && (
                        <div 
                            onClick={() => setIsCreateWorkspaceOpen(true)}
                            className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-700 cursor-pointer transition-all border border-dashed border-slate-600 hover:border-emerald-500/50"
                            title="Create Workspace"
                        >
                            <Plus className="w-5 h-5" />
                        </div>
                    )}
                    
                    <div className="flex-1" />
                    <button onClick={logout} className="p-2 text-slate-500 hover:text-slate-300 transition-colors mb-2" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Sidebar (Project Nav) */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 h-full">
                    {/* Project Selector */}
                    {activeProject ? (
                        <div className="p-4 border-b border-slate-200/50">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                                    className="w-full flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm"
                                >
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 text-xs">
                                            {activeProject.key.substring(0, 3)}
                                        </div>
                                        <div className="text-left min-w-0">
                                            <h3 className="text-sm font-bold text-slate-800 truncate">{activeProject.name}</h3>
                                            <p className="text-xs text-slate-500 truncate capitalize">{activeProject.type} project</p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {isProjectMenuOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-up">
                                        <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Project</div>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            {projects.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => { setActiveProject(p.id); setIsProjectMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${p.id === activeProject.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    <span className="truncate mr-2">{p.name}</span>
                                                    {p.id === activeProject.id && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
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
                    ) : (
                        <div className="p-6 text-center border-b border-slate-200/50">
                            <p className="text-sm text-slate-500 mb-2">No active project</p>
                            {canCreateProject && (
                                <button 
                                    onClick={() => setIsCreateProjectOpen(true)}
                                    className="text-xs text-indigo-600 hover:underline font-medium"
                                >
                                    Create one now
                                </button>
                            )}
                        </div>
                    )}

                    <div className="px-4 py-4">
                        <button 
                            onClick={() => setIsCreateIssueOpen(true)}
                            disabled={!activeProject}
                            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-md hover:shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2 font-medium text-sm transform active:scale-[0.98] ${!activeProject ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            onClick={() => handleViewChange('roadmap')}
                        />
                        <SidebarItem 
                            icon={<ListTodo className="w-5 h-5" />} 
                            label="Backlog" 
                            active={currentView === 'backlog'}
                            onClick={() => handleViewChange('backlog')}
                        />
                        <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">
                                Development
                        </div>
                        <SidebarItem 
                            icon={<Kanban className="w-5 h-5" />} 
                            label="Active Board" 
                            active={currentView === 'board'}
                            onClick={() => handleViewChange('board')}
                        />
                        <SidebarItem 
                            icon={<LayoutDashboard className="w-5 h-5" />} 
                            label="Reports" 
                            active={currentView === 'dashboard'}
                            onClick={() => handleViewChange('dashboard')}
                        />
                        <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">
                                Organization
                        </div>
                        <SidebarItem 
                            icon={<Users className="w-5 h-5" />} 
                            label="Teams" 
                            active={currentView === 'teams'}
                            onClick={() => handleViewChange('teams')}
                        />
                        
                        <div className="pt-4 mt-4 border-t border-slate-200">
                            <SidebarItem 
                                icon={<SettingsIcon className="w-5 h-5" />} 
                                label="Project Settings" 
                                active={currentView === 'settings'}
                                onClick={() => handleViewChange('settings')} 
                            />
                        </div>
                    </nav>

                    <div className="p-4 border-t border-slate-200 bg-white">
                        <div 
                            onClick={() => handleViewChange('profile')}
                            className={`flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${currentView === 'profile' ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-100 border border-transparent'}`}
                        >
                            <img src={currentUser?.avatar} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm object-cover" alt="Avatar" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-700 truncate">{currentUser?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{currentUser?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0 relative">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20 relative shadow-sm">
                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden mr-3 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1 max-w-xl flex items-center">
                        <div className="relative group w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={activeProject ? `Search ${activeProject.name}...` : "Search..."} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-slate-100 focus:bg-white"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 md:space-x-4 ml-4">
                        <button className="text-slate-400 hover:text-slate-600 transition-colors hidden md:block">
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
                <main className="flex-1 bg-slate-50 overflow-hidden relative w-full">
                    {renderView()}
                </main>
            </div>

            {isCreateIssueOpen && <CreateIssueModal onClose={() => setIsCreateIssueOpen(false)} />}
            {isCreateProjectOpen && <CreateProjectModal onClose={() => setIsCreateProjectOpen(false)} />}
            {isCreateWorkspaceOpen && <CreateWorkspaceModal onClose={() => setIsCreateWorkspaceOpen(false)} />}
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