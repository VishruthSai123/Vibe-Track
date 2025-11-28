import { Issue, Project, Workspace, User, Sprint, Epic, Team, Notification } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- FALLBACK MOCK DATA (For when Supabase isn't configured) ---
const LOCAL_STORAGE_KEY = 'vibetrack-storage-v2';

// Helper to get local data
const getLocalData = () => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
};

// Helper to handle Supabase errors
const handleSupabaseError = (error: any) => {
  if (error) {
    console.error("Supabase API Error:", error);
    throw new Error(error.message || "Database error");
  }
};

export const api = {
  // --- USERS & WORKSPACES ---
  getUsers: async (): Promise<User[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      handleSupabaseError(error);
      return data as User[];
    }
    const data = getLocalData();
    return data?.users || [];
  },

  getWorkspaces: async (): Promise<Workspace[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('workspaces').select('*');
      handleSupabaseError(error);
      return data as Workspace[];
    }
    const data = getLocalData();
    return data?.workspaces || [];
  },

  updateWorkspace: async (workspace: Workspace): Promise<void> => {
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('workspaces').update({ members: workspace.members }).eq('id', workspace.id);
        handleSupabaseError(error);
    }
  },

  // --- PROJECTS ---
  getProjects: async (workspaceId: string): Promise<Project[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').select('*').eq('workspaceId', workspaceId);
      handleSupabaseError(error);
      return data as Project[];
    }
    const data = getLocalData();
    return data?.projects.filter((p: Project) => p.workspaceId === workspaceId) || [];
  },

  createProject: async (project: Project): Promise<Project> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      handleSupabaseError(error);
      return data as Project;
    }
    return project;
  },

  updateProject: async (project: Project): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('projects').update(project).eq('id', project.id);
      handleSupabaseError(error);
    }
  },

  // --- ISSUES ---
  getIssues: async (projectId: string): Promise<Issue[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('issues').select('*').eq('projectId', projectId);
      handleSupabaseError(error);
      return data as Issue[];
    }
    const data = getLocalData();
    return data?.issues.filter((i: Issue) => i.projectId === projectId) || [];
  },

  createIssue: async (issue: Issue): Promise<Issue> => {
    if (isSupabaseConfigured) {
      // Clean up fields to match Schema expected types if necessary
      const payload = {
        ...issue,
        sprintId: issue.sprintId || null,
        epicId: issue.epicId || null,
        assigneeId: issue.assigneeId || null,
        // JSONB fields are handled automatically by Supabase client if passed as objects/arrays
      };
      const { data, error } = await supabase.from('issues').insert(payload).select().single();
      handleSupabaseError(error);
      return data as Issue;
    }
    return issue;
  },

  updateIssue: async (issue: Issue): Promise<void> => {
    if (isSupabaseConfigured) {
      const payload = {
        ...issue,
        sprintId: issue.sprintId || null,
        epicId: issue.epicId || null,
        assigneeId: issue.assigneeId || null,
      };
      const { error } = await supabase.from('issues').update(payload).eq('id', issue.id);
      handleSupabaseError(error);
    }
  },

  deleteIssue: async (issueId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('issues').delete().eq('id', issueId);
      handleSupabaseError(error);
    }
  },

  // --- SPRINTS ---
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('sprints').select('*').eq('projectId', projectId);
      handleSupabaseError(error);
      return data as Sprint[];
    }
    const data = getLocalData();
    return data?.sprints.filter((s: Sprint) => s.projectId === projectId) || [];
  },

  createSprint: async (sprint: Sprint): Promise<Sprint> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('sprints').insert(sprint).select().single();
      handleSupabaseError(error);
      return data as Sprint;
    }
    return sprint;
  },

  updateSprint: async (sprint: Sprint): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('sprints').update(sprint).eq('id', sprint.id);
      handleSupabaseError(error);
    }
  },

  // --- EPICS ---
  getEpics: async (projectId: string): Promise<Epic[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('epics').select('*').eq('projectId', projectId);
      handleSupabaseError(error);
      return data as Epic[];
    }
    const data = getLocalData();
    return data?.epics.filter((e: Epic) => e.projectId === projectId) || [];
  },

  // --- TEAMS ---
  getTeams: async (workspaceId: string): Promise<Team[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('teams').select('*').eq('workspaceId', workspaceId);
      handleSupabaseError(error);
      return data as Team[];
    }
    const data = getLocalData();
    return data?.teams.filter((t: Team) => t.workspaceId === workspaceId) || [];
  },

  createTeam: async (team: Team): Promise<Team> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('teams').insert(team).select().single();
      handleSupabaseError(error);
      return data as Team;
    }
    return team;
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId);
      handleSupabaseError(error);
      return data as Notification[];
    }
    return [];
  },

  createNotification: async (notif: Notification): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('notifications').insert(notif);
      if (error) console.error("Failed to send notification", error);
    }
  }
};