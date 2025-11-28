
export enum IssueType {
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum UserRole {
  FOUNDER = 'Founder',
  CTO = 'CTO',
  CAO = 'CAO',
  ADMIN = 'Admin',
  TEAM_LEAD = 'Team Lead',
  PRODUCT_MANAGER = 'Product Manager',
  MEMBER = 'Developer', // Default for engineers
  DESIGNER = 'Designer',
  QA = 'QA Engineer',
  OPS = 'Operations'
}

export enum Permission {
  CREATE_PROJECT = 'CREATE_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  MANAGE_ACCESS = 'MANAGE_ACCESS',
  CREATE_SPRINT = 'CREATE_SPRINT',
  MANAGE_SPRINT = 'MANAGE_SPRINT', // Start/Complete
  CREATE_EPIC = 'CREATE_EPIC',
  CREATE_TASK = 'CREATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  ASSIGN_TASK = 'ASSIGN_TASK',
  UPDATE_TASK_STATUS = 'UPDATE_TASK_STATUS',
  MANAGE_TEAMS = 'MANAGE_TEAMS',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string; // stored as string, mapped to UserRole
  workspaceIds: string[];
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  leadId: string;
  type: 'software' | 'marketing' | 'business';
}

export interface Team {
  id: string;
  name: string;
  workspaceId: string;
  members: string[]; // userIds
  leadId: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'PLANNED' | 'COMPLETED';
  goal: string;
  capacity?: number;
}

export interface Epic {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string; // Tailwind class like 'bg-blue-500'
  status: 'PROGRESS' | 'DONE' | 'TODO';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'ASSIGNMENT' | 'COMMENT' | 'SYSTEM';
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  type: IssueType;
  assigneeId?: string;
  reporterId: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  summary?: string; // AI Generated summary
  
  // Agile fields
  sprintId?: string | null; // null means Backlog
  epicId?: string;
  storyPoints?: number;
  
  // Extended fields
  subtasks: Subtask[];
  attachments: Attachment[];
}

export interface ColumnType {
  id: Status;
  title: string;
}

export const COLUMNS: ColumnType[] = [
  { id: Status.TODO, title: 'To Do' },
  { id: Status.IN_PROGRESS, title: 'In Progress' },
  { id: Status.IN_REVIEW, title: 'In Review' },
  { id: Status.DONE, title: 'Done' },
];
