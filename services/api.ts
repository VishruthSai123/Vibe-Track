import { Issue, Project, Workspace, User, Sprint, Epic, Team, Notification } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Helper to handle Supabase errors
const handleSupabaseError = (error: any) => {
  if (error) {
    console.error("Supabase API Error:", JSON.stringify(error, null, 2));
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
    return [];
  },

  getWorkspaces: async (): Promise<Workspace[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('workspaces').select('*');
      handleSupabaseError(error);
      return data as Workspace[];
    }
    return [];
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
    return [];
  },

  createProject: async (project: Project): Promise<Project> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      handleSupabaseError(error);
      return data as Project;
    }
    throw new Error("Supabase not configured");
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
    return [];
  },

  createIssue: async (issue: Issue): Promise<Issue> => {
    if (isSupabaseConfigured) {
      const payload = {
        ...issue,
        sprintId: issue.sprintId || null,
        epicId: issue.epicId || null,
        assigneeId: issue.assigneeId || null,
      };
      const { data, error } = await supabase.from('issues').insert(payload).select().single();
      handleSupabaseError(error);
      return data as Issue;
    }
    throw new Error("Supabase not configured");
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
    return [];
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
    return [];
  },

  // --- TEAMS ---
  getTeams: async (workspaceId: string): Promise<Team[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('teams').select('*').eq('workspaceId', workspaceId);
      handleSupabaseError(error);
      return data as Team[];
    }
    return [];
  },

  createTeam: async (team: Team): Promise<Team> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('teams').insert(team).select().single();
      handleSupabaseError(error);
      return data as Team;
    }
    return team;
  },

  updateTeam: async (team: Team): Promise<void> => {
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('teams').update({ members: team.members }).eq('id', team.id);
        handleSupabaseError(error);
    }
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
  },

  // --- STORAGE ---
  uploadFile: async (file: File): Promise<string> => {
    if (isSupabaseConfigured) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

        if (uploadError) {
             throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
    throw new Error("Supabase not configured");
  }
};