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
  resetPassword: (email: string) => Promise<void>;
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
  addMemberToTeam: (teamId: string, userId: string) => void;
  removeMemberFromTeam: (teamId: string, userId: string) => void;
  inviteUser: (email: string) => Promise<void>;
  updateProjectInfo: (info: Project) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  uploadAttachment: (file: File) => Promise<string>;
  
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

  // Derived Auth State
  const isAuthenticated = !!currentUser;

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
                // Fallback & Self-Healing: Profile missing from DB. Try to insert it.
                console.warn("User profile missing in DB. Attempting self-healing insert.");
                const newProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata.full_name || 'User',
                    role: 'Developer',
                    avatar: `https://ui-avatars.com/api/?name=${session.user.user_metadata.full_name || 'U'}&background=random`,
                    workspaceIds: []
                };
                
                const { error: insertError } = await supabase.from('profiles').insert(newProfile);
                if (insertError) {
                     console.error("Self-healing profile insert failed:", JSON.stringify(insertError, null, 2));
                     // We continue locally, but DB operations might fail if they rely on this row existence
                }
                
                userObj = newProfile;
            }

            // 2. Fetch Workspaces & Users (Parallel)
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

  // 2. REAL-TIME SUBSCRIPTIONS
  useEffect(() => {
    if (!isAuthenticated || !activeProjectId) return;

    // Subscribe to Issues, Sprints, Epics changes for the active project
    const channel = supabase.channel(`project-${activeProjectId}`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'issues', filter: `projectId=eq.${activeProjectId}` }, 
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    setAllIssues(prev => {
                        // Anti-duplication: Check if ID already exists (e.g. from optimistic update or race condition)
                        if (prev.some(i => i.id === payload.new.id)) return prev;
                        return [...prev, payload.new as Issue];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setAllIssues(prev => prev.map(i => i.id === payload.new.id ? payload.new as Issue : i));
                } else if (payload.eventType === 'DELETE') {
                    setAllIssues(prev => prev.filter(i => i.id !== payload.old.id));
                }
            }
        )
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'sprints', filter: `projectId=eq.${activeProjectId}` }, 
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    setAllSprints(prev => {
                        if (prev.some(s => s.id === payload.new.id)) return prev;
                        return [...prev, payload.new as Sprint];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setAllSprints(prev => prev.map(s => s.id === payload.new.id ? payload.new as Sprint : s));
                }
            }
        )
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'notifications', filter: `userId=eq.${currentUser?.id}` }, 
            (payload) => {
                 if (payload.eventType === 'INSERT') {
                     setNotifications(prev => [payload.new as Notification, ...prev]);
                     showToast(`New Notification: ${(payload.new as Notification).title}`, 'info');
                 }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [isAuthenticated, activeProjectId, currentUser]);


  // 3. Fetch Projects & Teams when Active Workspace changes
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

  // 4. Fetch Issues/Sprints/Epics when Active Project changes
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
           
           if (authError) {
               throw new Error(authError.message || "Authentication failed during signup");
           }
           
           if (authData.user) {
             const userId = authData.user.id;
             const workspaceId = `ws-${Date.now()}`;
             const projectId = `p-${Date.now()}`;
             
             // 2. Prepare Data
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

             // 3. Sequential Inserts with Strict Validation
             const { error: profileError } = await supabase.from('profiles').upsert(userProfileUpdate);
             if (profileError) {
                 console.warn("Profile upsert returned error:", profileError);
                 const { data: exists } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
                 if (!exists) {
                     const { error: insertError } = await supabase.from('profiles').insert(userProfileUpdate);
                     if (insertError) {
                         throw new Error(`Failed to create user profile: ${insertError.message}`);
                     }
                 }
             }

             const { error: wsError } = await supabase.from('workspaces').insert(newWorkspace);
             if (wsError) throw new Error(`Failed to create workspace: ${wsError.message}`);

             const { error: projError } = await supabase.from('projects').insert(newProject);
             if (projError) throw new Error(`Failed to create project: ${projError.message}`);

             // 4. Optimistic State Update
             setCurrentUser(userProfileUpdate as User);
             setWorkspaces([newWorkspace]);
             setAllProjects([newProject]);
             setActiveWorkspaceId(workspaceId);
             setActiveProjectId(projectId);
             
             showToast("Account created successfully!", "success");
           }
       } catch (e: any) {
           console.error("Signup failed:", e);
           
           let msg = "Unknown error";
           if (e instanceof Error) {
               msg = e.message;
           } else if (e?.message) {
               msg = e.message;
           } else if (typeof e === 'string') {
               msg = e;
           } else if (typeof e === 'object') {
               try {
                   msg = JSON.stringify(e);
                   if (msg === '{}') msg = "An unknown error occurred during signup.";
               } catch {
                   msg = "An error occurred (details unavailable).";
               }
           }
           
           if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already exists")) {
               showToast("This email is already registered. Please log in.", "info");
           } else {
               showToast(`Signup failed: ${msg}`, "error");
           }
       } finally {
           setIsLoading(false);
       }
    } else {
      showToast("Supabase not configured.", "error");
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured) {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href,
        });
        if (error) throw error;
        showToast("Password reset link sent to your email.", "success");
      } catch (e: any) {
        console.error("Reset password error:", e);
        showToast(e.message || "Failed to send reset email", "error");
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
    
    // --- 1. SELF-HEALING: Profile Verification ---
    try {
        const { data: profileExists, error: fetchError } = await supabase.from('profiles').select('id').eq('id', currentUser.id).maybeSingle();
        
        if (!profileExists) {
            console.warn("Profile check failed. Attempting self-healing insert.");
            const { error: recoveryError } = await supabase.from('profiles').insert({
                id: currentUser.id,
                name: currentUser.name || 'User',
                email: currentUser.email,
                avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name || 'U'}&background=random`,
                role: currentUser.role || 'Developer'
            });

            if (recoveryError) {
                console.error("Profile recovery failed:", JSON.stringify(recoveryError, null, 2));
                showToast("Account Error: We couldn't verify your profile. Please try refreshing.", "error");
                return; 
            }
        }
    } catch (e) {
        console.error("Profile verification error", e);
    }

    // --- 2. Workspace Verification/Creation ---
    let targetWorkspaceId = activeWorkspaceId;

    if (!targetWorkspaceId) {
        const newWsId = `ws-${Date.now()}`;
        const newWorkspace: Workspace = {
            id: newWsId,
            name: `${currentUser.name}'s Workspace`,
            ownerId: currentUser.id,
            members: [currentUser.id]
        };

        const { error: wsError } = await supabase.from('workspaces').insert(newWorkspace);
        if (wsError) {
            console.error("Auto-creation of workspace failed", JSON.stringify(wsError, null, 2));
            showToast(`Failed to create default workspace: ${wsError.message}`, "error");
            return;
        }

        setWorkspaces(prev => [...prev, newWorkspace]);
        setActiveWorkspaceId(newWsId);
        targetWorkspaceId = newWsId;
    }

    // --- 3. Permission Check ---
    if (allProjects.length > 0 && !checkPermission(Permission.CREATE_PROJECT)) {
        showToast("You do not have permission to create projects.", "error");
        return;
    }

    // --- 4. Create Project ---
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
    } catch (e: any) {
        console.error("Failed to create project", e);
        showToast(`Failed to create project: ${e.message}`, "error");
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

  const addMemberToTeam = async (teamId: string, userId: string) => {
      const team = allTeams.find(t => t.id === teamId);
      if (!team || team.members.includes(userId)) return;
      
      const updatedTeam = { ...team, members: [...team.members, userId] };
      setAllTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t)); // Optimistic
      
      try {
          await api.updateTeam(updatedTeam);
          showToast("Member added", "success");
      } catch (e) {
          console.error(e);
          setAllTeams(prev => prev.map(t => t.id === teamId ? team : t)); // Revert
          showToast("Failed to add member", "error");
      }
  };

  const removeMemberFromTeam = async (teamId: string, userId: string) => {
      const team = allTeams.find(t => t.id === teamId);
      if (!team) return;
      
      const updatedTeam = { ...team, members: team.members.filter(id => id !== userId) };
      setAllTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t)); // Optimistic
      
      try {
          await api.updateTeam(updatedTeam);
          showToast("Member removed", "success");
      } catch (e) {
          console.error(e);
          setAllTeams(prev => prev.map(t => t.id === teamId ? team : t)); // Revert
          showToast("Failed to remove member", "error");
      }
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
          showToast(`User ${email} not found in system. They must sign up first.`, "info");
      }
  };

  const addIssue = async (newIssue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'subtasks' | 'attachments' | 'projectId'>) => {
    if (!activeProject) return;
    
    const suffix = Date.now().toString().slice(-4); 
    const readableId = `${activeProject.key}-${suffix}`;
    
    const issue: Issue = {
      ...newIssue,
      projectId: activeProject.id,
      id: readableId, 
      comments: [], subtasks: [], attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setAllIssues(prev => [...prev, issue]);
    showToast("Issue created", "success");

    try {
        const createdIssue = await api.createIssue({ ...newIssue, projectId: activeProject.id, id: readableId } as Issue);
        setAllIssues(prev => {
             if (prev.some(i => i.id === createdIssue.id && i !== issue)) {
                 return prev.filter(i => i.id !== readableId);
             }
             return prev.map(i => i.id === readableId ? createdIssue : i);
        });
    } catch (e) {
        console.error("Failed to create issue", e);
        setAllIssues(prev => prev.filter(i => i.id !== readableId));
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
    showToast("Sprint created", "success");
  };

  const startSprint = async (sprintId: string, startDate: string, endDate: string, goal?: string) => {
    const sprint = allSprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    const updates = { status: 'ACTIVE' as const, startDate, endDate, goal: goal || sprint.goal };
    const updatedSprint = { ...sprint, ...updates };

    await api.updateSprint(updatedSprint);
    showToast(`${sprint.name} started!`, "success");
  };

  const completeSprint = async (sprintId: string, spilloverAction: 'BACKLOG' | 'NEXT_SPRINT') => {
    const sprint = allSprints.find(s => s.id === sprintId);
    if (!sprint) return;

    await api.updateSprint({ ...sprint, status: 'COMPLETED' });
    
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

  const uploadAttachment = async (file: File): Promise<string> => {
      try {
          return await api.uploadFile(file);
      } catch (e: any) {
          showToast(e.message, "error");
          throw e;
      }
  };

  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearNotifications = () => setNotifications([]);

  return (
    <ProjectContext.Provider value={{ 
      workspaces, projects, teams, issues, users, sprints, epics, notifications,
      activeWorkspace, activeProject, activeSprint, currentUser, searchQuery, isAuthenticated: !!currentUser, isLoading,
      login, signup, logout, resetPassword, setActiveWorkspace: setActiveWorkspaceId, setActiveProject: setActiveProjectId, createProject,
      setSearchQuery, addIssue, updateIssue, deleteIssue, addComment, createSprint, startSprint, completeSprint,
      createTeam, addMemberToTeam, removeMemberFromTeam, inviteUser, updateProjectInfo, updateUser, markNotificationRead, clearNotifications, checkPermission,
      toasts, showToast, removeToast, uploadAttachment
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