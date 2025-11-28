import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Issue, User, Status, Priority, IssueType, Sprint, Epic, Project, Notification, Workspace, Team, Permission } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { hasPermission } from '../utils/rbac';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ProjectContextType {
  // Data
  workspaces: Workspace[];
  projects: Project[];
  teams: Team[];
  issues: Issue[];
  users: User[];
  sprints: Sprint[];
  epics: Epic[];
  notifications: Notification[];
  
  // State
  activeWorkspace: Workspace | null;
  activeProject: Project | null;
  activeSprint: Sprint | undefined;
  currentUser: User | null;
  searchQuery: string;
  isAuthenticated: boolean;
  toasts: Toast[];

  // Actions
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, workspaceName: string, role: string, password?: string) => Promise<void>;
  logout: () => void;
  setActiveWorkspace: (id: string) => void;
  setActiveProject: (id: string) => void;
  createProject: (name: string, key: string, description: string, type: Project['type']) => void;
  
  // Entity Actions
  setSearchQuery: (query: string) => void;
  addIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'subtasks' | 'attachments' | 'projectId'>) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  addComment: (issueId: string, text: string, userId: string) => void;
  createSprint: (name: string, goal: string, capacity?: number) => void;
  startSprint: (sprintId: string, startDate: string, endDate: string, goal?: string) => void;
  completeSprint: (sprintId: string, spilloverAction: 'BACKLOG' | 'NEXT_SPRINT') => void;
  createTeam: (name: string, memberIds: string[]) => void;
  inviteUser: (email: string) => Promise<void>;
  updateProjectInfo: (info: Project) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // RBAC
  checkPermission: (permission: Permission) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [allEpics, setAllEpics] = useState<Epic[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Selection State
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  }, []);

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initial Load & Auth Check
  useEffect(() => {
    let subscription: any;
    
    const init = async () => {
      // 1. Check Supabase Session
      if (isSupabaseConfigured) {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
             if (session?.user) {
                 const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
                 if (profile) {
                     setCurrentUser(profile as User);
                     if (profile.workspaceIds?.length > 0 && !activeWorkspaceId) {
                         setActiveWorkspaceId(profile.workspaceIds[0]);
                     }
                 }
             } else {
                 setCurrentUser(null);
             }
             setLoading(false);
        });
        subscription = authListener.subscription;

        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) setLoading(false);
      } else {
        // Fallback Local Storage Auth
        const savedUser = localStorage.getItem('vibetrack-user');
        if (savedUser) {
           const user = JSON.parse(savedUser);
           setCurrentUser(user);
           if (user.workspaceIds?.length > 0) setActiveWorkspaceId(user.workspaceIds[0]);
        }
        setLoading(false);
      }
    };
    init();

    return () => {
        if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Fetch Data when Active Workspace/Project changes
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        const [ws, usrs] = await Promise.all([
          api.getWorkspaces(),
          api.getUsers()
        ]);
        setWorkspaces(ws);
        setUsers(usrs);

        if (activeWorkspaceId) {
           const [projs, tms] = await Promise.all([
             api.getProjects(activeWorkspaceId),
             api.getTeams(activeWorkspaceId)
           ]);
           setAllProjects(projs);
           setAllTeams(tms);
           
           // Default active project
           if (!activeProjectId && projs.length > 0) {
              setActiveProjectId(projs[0].id);
           }
        }
      } catch (e) {
        console.error("Failed to fetch workspace data", e);
        showToast("Failed to load workspace data", "error");
      }
    };
    fetchData();
  }, [currentUser, activeWorkspaceId, showToast]);

  // Fetch Project Specific Data
  useEffect(() => {
     if (!activeProjectId) return;
     const fetchProjectData = async () => {
        try {
          const [iss, sps, eps] = await Promise.all([
            api.getIssues(activeProjectId),
            api.getSprints(activeProjectId),
            api.getEpics(activeProjectId)
          ]);
          setAllIssues(iss);
          setAllSprints(sps);
          setAllEpics(eps);
        } catch (e) {
          console.error("Failed to fetch project data", e);
        }
     };
     fetchProjectData();
  }, [activeProjectId]);


  // --- DERIVED STATE ---
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;
  const activeProject = allProjects.find(p => p.id === activeProjectId) || null;
  const projects = allProjects; 
  const teams = allTeams;
  const issues = allIssues; 
  const sprints = allSprints;
  const epics = allEpics;
  const activeSprint = sprints.find(s => s.status === 'ACTIVE');

  // --- ACTIONS ---

  const checkPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    return hasPermission(currentUser.role, permission);
  };

  const login = async (email: string, password?: string) => {
    if (isSupabaseConfigured && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Welcome back!", "success");
      }
    } else {
      // Simulation Login
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('vibetrack-user', JSON.stringify(user));
        if (user.workspaceIds.length > 0) setActiveWorkspaceId(user.workspaceIds[0]);
        showToast("Welcome back!", "success");
      } else {
        showToast("User not found. Try 'alex@vibetrack.com'", "error");
      }
    }
  };

  const signup = async (name: string, email: string, workspaceName: string, role: string, password?: string) => {
    if (isSupabaseConfigured && password) {
       const { data: authData, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
       if (authError) {
         showToast(authError.message, "error");
         return;
       }
       if (authData.user) {
         // Note: Triggers in SQL usually handle profile creation. 
         // Here we assume manual creation for robustness if triggers fail or aren't set up yet in this demo env
         const userId = authData.user.id;
         const workspaceId = `ws-${Date.now()}`;
         
         const newUser: User = {
            id: userId,
            name,
            email,
            avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
            role, 
            workspaceIds: [workspaceId]
         };
         
         const newWorkspace: Workspace = {
            id: workspaceId,
            name: workspaceName,
            ownerId: userId,
            members: [userId]
         };

         const newProject: Project = {
           id: `p-${Date.now()}`,
           workspaceId,
           name: 'My First Project',
           key: 'PROJ',
           description: 'Your first project',
           leadId: userId,
           type: 'software'
         };

         try {
             // In a real app with triggers, we might skip profile insertion if trigger exists
             // but for safety in this demo context:
             const { error: profileError } = await supabase.from('profiles').upsert(newUser);
             if(!profileError) {
                await supabase.from('workspaces').insert(newWorkspace);
                await supabase.from('projects').insert(newProject);
             }

             setActiveWorkspaceId(workspaceId);
             setActiveProjectId(newProject.id);
             showToast("Account created successfully!", "success");
         } catch (e: any) {
             showToast(`Error setting up account: ${e.message}`, "error");
         }
       }
    } else {
      // Simulation Signup
      const newWorkspaceId = `ws-${Date.now()}`;
      const newUserId = `u-${Date.now()}`;
      const newProjectId = `p-${Date.now()}`;

      const newUser: User = {
        id: newUserId, name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=random`, role, workspaceIds: [newWorkspaceId]
      };

      const newWorkspace: Workspace = {
        id: newWorkspaceId, name: workspaceName, ownerId: newUserId, members: [newUserId]
      };

      const newProject: Project = {
        id: newProjectId, workspaceId: newWorkspaceId, name: 'My First Project', key: 'PROJ', description: 'Your first project.', leadId: newUserId, type: 'software'
      };

      setUsers([...users, newUser]);
      setWorkspaces([...workspaces, newWorkspace]);
      setAllProjects([...allProjects, newProject]);
      setCurrentUser(newUser);
      setActiveWorkspaceId(newWorkspaceId);
      setActiveProjectId(newProjectId);
      localStorage.setItem('vibetrack-user', JSON.stringify(newUser));
      showToast("Account created successfully!", "success");
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('vibetrack-user');
    showToast("Logged out successfully", "info");
  };

  const createProject = async (name: string, key: string, description: string, type: Project['type']) => {
    if (!activeWorkspace || !currentUser) return;
    if (!checkPermission(Permission.CREATE_PROJECT)) {
        showToast("You do not have permission to create projects.", "error");
        return;
    }
    const newProject: Project = {
      id: `p-${Date.now()}`,
      workspaceId: activeWorkspace.id,
      name, key, description, type,
      leadId: currentUser.id
    };
    
    await api.createProject(newProject);
    setAllProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    showToast("Project created successfully", "success");
  };

  const createTeam = async (name: string, memberIds: string[]) => {
      if (!activeWorkspace || !currentUser) return;
      const newTeam: Team = {
          id: `t-${Date.now()}`,
          workspaceId: activeWorkspace.id,
          name,
          leadId: currentUser.id,
          members: memberIds
      };
      await api.createTeam(newTeam);
      setAllTeams(prev => [...prev, newTeam]);
      showToast("Team created", "success");
  };

  const inviteUser = async (email: string) => {
      if (!activeWorkspace) return;
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
          if (!activeWorkspace.members.includes(existingUser.id)) {
              const updatedWorkspace = {
                  ...activeWorkspace,
                  members: [...activeWorkspace.members, existingUser.id]
              };
              await api.updateWorkspace(updatedWorkspace);
              setWorkspaces(prev => prev.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));
              showToast(`${email} added to workspace.`, "success");
          } else {
              showToast(`${email} is already in the workspace.`, "info");
          }
      } else {
          showToast(`Invitation sent to ${email}`, "success");
      }
  };

  const addIssue = async (newIssue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'subtasks' | 'attachments' | 'projectId'>) => {
    if (!activeProject) return;
    
    const tempId = `${activeProject.key}-${100 + issues.length + 1}`;
    
    const issue: Issue = {
      ...newIssue,
      projectId: activeProject.id,
      id: tempId,
      comments: [], subtasks: [], attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setAllIssues(prev => [...prev, issue]);
    showToast("Issue created", "success");

    try {
        await api.createIssue(issue);
    } catch (e) {
        console.error("Failed to create issue", e);
        setAllIssues(prev => prev.filter(i => i.id !== tempId));
        showToast("Failed to create issue on server", "error");
    }
  };

  const updateIssue = async (id: string, updates: Partial<Issue>) => {
    const updatedIssue = allIssues.find(i => i.id === id);
    if (!updatedIssue) return;
    
    const newItem = { ...updatedIssue, ...updates, updatedAt: new Date().toISOString() };
    
    setAllIssues(prev => prev.map(issue => issue.id === id ? newItem : issue));
    
    try {
        await api.updateIssue(newItem);
    } catch (e) {
         console.error("Failed to update issue", e);
         setAllIssues(prev => prev.map(issue => issue.id === id ? updatedIssue : issue));
         showToast("Failed to update issue", "error");
    }
  };

  const deleteIssue = async (id: string) => {
    const previousIssues = [...allIssues];
    setAllIssues(prev => prev.filter(i => i.id !== id));
    
    try {
        await api.deleteIssue(id);
        showToast("Issue deleted", "success");
    } catch (e) {
        setAllIssues(previousIssues);
        showToast("Failed to delete issue", "error");
    }
  };

  const addComment = async (issueId: string, text: string, userId: string) => {
    const issue = allIssues.find(i => i.id === issueId);
    if (!issue) return;
    
    const newComment = { id: `c-${Date.now()}`, text, userId, createdAt: new Date().toISOString() };
    const updatedComments = [...issue.comments, newComment];
    
    await updateIssue(issueId, { comments: updatedComments });
  };

  const createSprint = async (name: string, goal: string, capacity: number = 30) => {
    if (!activeProject) return;
    const newSprint: Sprint = {
      id: `sp-${Date.now()}`, projectId: activeProject.id, name, goal, status: 'PLANNED', capacity
    };
    await api.createSprint(newSprint);
    setAllSprints(prev => [...prev, newSprint]);
    showToast("Sprint created", "success");
  };

  const startSprint = async (sprintId: string, startDate: string, endDate: string, goal?: string) => {
    const sprint = allSprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    const updates = { status: 'ACTIVE' as const, startDate, endDate, goal: goal || sprint.goal };
    const updatedSprint = { ...sprint, ...updates };

    await api.updateSprint(updatedSprint);
    setAllSprints(prev => prev.map(s => s.id === sprintId ? updatedSprint : s));
    showToast(`${sprint.name} started!`, "success");
  };

  const completeSprint = async (sprintId: string, spilloverAction: 'BACKLOG' | 'NEXT_SPRINT') => {
    const sprint = allSprints.find(s => s.id === sprintId);
    if (!sprint) return;

    await api.updateSprint({ ...sprint, status: 'COMPLETED' });
    setAllSprints(prev => prev.map(s => s.id === sprintId ? { ...s, status: 'COMPLETED' } : s));
    
    let nextSprintId: string | null = null;
    if (spilloverAction === 'NEXT_SPRINT') {
        const plannedSprints = allSprints.filter(s => s.projectId === activeProjectId && s.status === 'PLANNED');
        if (plannedSprints.length > 0) {
            nextSprintId = plannedSprints[0].id;
        }
    }

    const issuesToMove = issues.filter(i => i.sprintId === sprintId && i.status !== Status.DONE);
    for (const issue of issuesToMove) {
        await updateIssue(issue.id, { sprintId: nextSprintId });
    }
    showToast("Sprint completed!", "success");
  };

  const updateProjectInfo = async (info: Project) => {
    await api.updateProject(info);
    setAllProjects(prev => prev.map(p => p.id === info.id ? info : p));
    showToast("Project updated", "success");
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    if (isSupabaseConfigured) {
        await supabase.from('profiles').update(updates).eq('id', userId);
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    showToast("Profile updated", "success");
  };

  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearNotifications = () => setNotifications([]);

  return (
    <ProjectContext.Provider value={{ 
      workspaces, projects, teams, issues, users, sprints, epics, notifications,
      activeWorkspace, activeProject, activeSprint, currentUser, searchQuery, isAuthenticated: !!currentUser,
      login, signup, logout, setActiveWorkspace: setActiveWorkspaceId, setActiveProject: setActiveProjectId, createProject,
      setSearchQuery, addIssue, updateIssue, deleteIssue, addComment, createSprint, startSprint, completeSprint,
      createTeam, inviteUser, updateProjectInfo, updateUser, markNotificationRead, clearNotifications, checkPermission,
      toasts, showToast, removeToast
    }}>
      {!loading && children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};