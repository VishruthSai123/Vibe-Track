import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Issue, User, Status, Priority, IssueType, Sprint, Epic, Project, Notification, Workspace, Team, Permission, UserRole } from '../types';
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
  isLoading: boolean;

  // Actions
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, workspaceName: string, role: string, password?: string) => Promise<void>;
  logout: () => void;
  setActiveWorkspace: (id: string) => void;
  setActiveProject: (id: string) => void;
  createProject: (name: string, key: string, description: string, type: Project['type']) => Promise<void>;
  
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
  const [isLoading, setIsLoading] = useState(true);
  
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
      }, 4000);
  }, []);

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Initial Auth & Data Load
  useEffect(() => {
    let mounted = true;

    // Helper to load user data and workspaces
    const handleSession = async (session: any) => {
        if (!session?.user) {
            if (mounted) {
                setCurrentUser(null);
                setWorkspaces([]);
                setAllProjects([]);
                setActiveWorkspaceId('');
                setActiveProjectId('');
                setIsLoading(false);
            }
            return;
        }

        try {
            // 1. Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            let userObj: User;

            if (profile) {
                userObj = profile as User;
            } else {
                // Fallback
                userObj = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata.full_name || 'User',
                    role: 'Developer',
                    avatar: '',
                    workspaceIds: []
                };
            }

            // 2. Fetch Workspaces & Users (Parallel)
            // We fetch these BEFORE setting loading=false to avoid UI flash
            const [wsData, allUsers] = await Promise.all([
                api.getWorkspaces(),
                api.getUsers()
            ]);

            if (mounted) {
                // Update User
                setCurrentUser(userObj);
                setUsers(allUsers);

                // Update Workspaces
                const shouldHaveWorkspaces = userObj.workspaceIds && userObj.workspaceIds.length > 0;
                
                // Only overwrite workspaces if we got data or we expect none
                if (wsData.length > 0) {
                    setWorkspaces(wsData);
                    
                    // Set active workspace logic
                    // Prefer the one in profile if valid, else first one
                    const preferredId = userObj.workspaceIds?.find(id => wsData.some(w => w.id === id));
                    
                    if (preferredId) {
                        setActiveWorkspaceId(preferredId);
                    } else if (wsData[0]) {
                        setActiveWorkspaceId(wsData[0].id);
                    }
                } else if (!shouldHaveWorkspaces) {
                    setWorkspaces([]);
                }
            }
        } catch (error) {
            console.error("Error loading session data:", error);
        } finally {
            if (mounted) setIsLoading(false);
        }
    };

    const init = async () => {
        if (!isSupabaseConfigured) {
            if (mounted) setIsLoading(false);
            return;
        }

        try {
            // Check initial session
            const { data: { session } } = await supabase.auth.getSession();
            await handleSession(session);

            // Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                 if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                     await handleSession(session);
                 } else if (event === 'SIGNED_OUT') {
                     await handleSession(null);
                 }
            });
            
            return subscription;
        } catch (e) {
            console.error("Auth init failed", e);
            if (mounted) setIsLoading(false);
        }
    };

    const subPromise = init();

    return () => {
        mounted = false;
        subPromise.then(sub => sub?.unsubscribe());
    };
  }, []);

  // 2. Fetch Projects & Teams when Active Workspace changes
  useEffect(() => {
    if (!activeWorkspaceId) return;

    const loadWorkspaceData = async () => {
       try {
           const [projs, tms] = await Promise.all([
             api.getProjects(activeWorkspaceId),
             api.getTeams(activeWorkspaceId)
           ]);
           setAllProjects(projs);
           setAllTeams(tms);
           
           // Auto-select first project if none selected or current selection is invalid
           const currentProjectValid = projs.some(p => p.id === activeProjectId);
           if ((!activeProjectId || !currentProjectValid) && projs.length > 0) {
              setActiveProjectId(projs[0].id);
           }
       } catch (e) {
           console.error("Error loading workspace data:", e);
       }
    };
    loadWorkspaceData();
  }, [activeWorkspaceId]);

  // 3. Fetch Issues/Sprints/Epics when Active Project changes
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
          console.error("Failed to fetch project details", e);
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
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showToast(error.message, "error");
        setIsLoading(false);
      } else {
        showToast("Welcome back!", "success");
        // State update happens in onAuthStateChange
      }
    } else {
      showToast("Supabase not configured.", "error");
    }
  };

  const signup = async (name: string, email: string, workspaceName: string, role: string, password?: string) => {
    if (isSupabaseConfigured && password) {
       setIsLoading(true);
       try {
           // 1. Sign up user
           const { data: authData, error: authError } = await supabase.auth.signUp({ 
               email, 
               password, 
               options: { data: { full_name: name } } 
           });
           
           if (authError) throw authError;
           
           if (authData.user) {
             const userId = authData.user.id;
             const workspaceId = `ws-${Date.now()}`;
             const projectId = `p-${Date.now()}`;
             
             // 2. Prepare Default Data
             const newWorkspace: Workspace = {
                id: workspaceId,
                name: workspaceName,
                ownerId: userId,
                members: [userId]
             };

             const newProject: Project = {
               id: projectId,
               workspaceId,
               name: 'My First Project',
               key: 'PROJ',
               description: 'Your first project',
               leadId: userId,
               type: 'software'
             };

             const userProfileUpdate = {
                id: userId,
                name,
                email,
                avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
                role: role, 
                workspaceIds: [workspaceId]
             };

             // 3. Sequential Inserts to ensure consistency
             // We upsert profile first (in case trigger already ran)
             const { error: profileError } = await supabase.from('profiles').upsert(userProfileUpdate);
             if (profileError) throw profileError;

             const { error: wsError } = await supabase.from('workspaces').insert(newWorkspace);
             if (wsError) throw wsError;

             const { error: projError } = await supabase.from('projects').insert(newProject);
             if (projError) throw projError;

             // 4. Optimistic State Update (Critical for immediate UX)
             // Update state BEFORE reducing loading to avoid flicker
             setCurrentUser(userProfileUpdate as User);
             setWorkspaces([newWorkspace]);
             setAllProjects([newProject]);
             setActiveWorkspaceId(workspaceId);
             setActiveProjectId(projectId);
             
             showToast("Account created successfully!", "success");
           }
       } catch (e: any) {
           console.error("Signup failed:", e);
           showToast(e.message || "Signup failed", "error");
       } finally {
           setIsLoading(false);
       }
    } else {
      showToast("Supabase not configured.", "error");
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setWorkspaces([]);
    setAllProjects([]);
    setActiveWorkspaceId('');
    setActiveProjectId('');
    showToast("Logged out successfully", "info");
  };

  const createProject = async (name: string, key: string, description: string, type: Project['type']) => {
    if (!currentUser) return;
    
    // Safety check: ensure we have a workspace
    let targetWorkspaceId = activeWorkspaceId;

    if (!targetWorkspaceId) {
        // Create a default workspace if none exists
        const newWsId = `ws-${Date.now()}`;
        const newWorkspace: Workspace = {
            id: newWsId,
            name: `${currentUser.name}'s Workspace`,
            ownerId: currentUser.id,
            members: [currentUser.id]
        };

        try {
            await supabase.from('workspaces').insert(newWorkspace);
            setWorkspaces(prev => [...prev, newWorkspace]);
            setActiveWorkspaceId(newWsId);
            targetWorkspaceId = newWsId;
        } catch (e) {
            console.error("Auto-creation of workspace failed", e);
            showToast("Failed to create default workspace", "error");
            return;
        }
    }

    // BOOTSTRAP PERMISSION CHECK
    // If there are NO projects, we allow creation regardless of role to bootstrap the account.
    // Otherwise, we enforce permissions.
    if (allProjects.length > 0 && !checkPermission(Permission.CREATE_PROJECT)) {
        showToast("You do not have permission to create projects.", "error");
        return;
    }

    const newProject: Project = {
      id: `p-${Date.now()}`,
      workspaceId: targetWorkspaceId,
      name, key, description, type,
      leadId: currentUser.id
    };
    
    try {
        await api.createProject(newProject);
        setAllProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
        showToast("Project created successfully", "success");
    } catch (e) {
        showToast("Failed to create project", "error");
    }
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
      // In a real app, this would send an email or create an invite record.
      // Here we simulate by adding if they exist in the DB.
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
          // This is a limitation of the demo/simple version. 
          // Real Supabase invites use `supabase.auth.admin.inviteUserByEmail` (backend only)
          showToast(`User ${email} not found in system. They must sign up first.`, "info");
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
    
    // Optimistic Update
    setAllIssues(prev => prev.map(issue => issue.id === id ? newItem : issue));
    
    try {
        await api.updateIssue(newItem);
    } catch (e) {
         console.error("Failed to update issue", e);
         // Revert
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
      activeWorkspace, activeProject, activeSprint, currentUser, searchQuery, isAuthenticated: !!currentUser, isLoading,
      login, signup, logout, setActiveWorkspace: setActiveWorkspaceId, setActiveProject: setActiveProjectId, createProject,
      setSearchQuery, addIssue, updateIssue, deleteIssue, addComment, createSprint, startSprint, completeSprint,
      createTeam, inviteUser, updateProjectInfo, updateUser, markNotificationRead, clearNotifications, checkPermission,
      toasts, showToast, removeToast
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};