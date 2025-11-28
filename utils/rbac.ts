
import { UserRole, Permission } from '../types';

// The centralized Matrix defining what each role can do
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.FOUNDER]: [
    Permission.CREATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.MANAGE_ACCESS,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
  ],
  [UserRole.CTO]: [
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    // Cannot create/delete projects or manage global access
  ],
  [UserRole.CAO]: [
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_TASK,
    Permission.UPDATE_TASK_STATUS,
    // Focused on administrative workflows
  ],
  [UserRole.PRODUCT_MANAGER]: [
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
  ],
  [UserRole.ADMIN]: [
    Permission.MANAGE_ACCESS,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    // Cannot create/delete projects
  ],
  [UserRole.TEAM_LEAD]: [
    Permission.CREATE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    // Can move tasks across states
  ],
  [UserRole.MEMBER]: [
    Permission.UPDATE_TASK_STATUS,
    // Basic access only
  ],
  [UserRole.DESIGNER]: [
    Permission.UPDATE_TASK_STATUS,
  ],
  [UserRole.QA]: [
    Permission.UPDATE_TASK_STATUS,
    Permission.CREATE_TASK, // QA often needs to report bugs
  ],
  [UserRole.OPS]: [
    Permission.UPDATE_TASK_STATUS,
  ],
};

export const hasPermission = (userRole: string, permission: Permission): boolean => {
  // Normalize role string to handle potential casing issues or UI variations
  // We map the string from the DB to our strict Enum
  const role = Object.values(UserRole).find(r => r === userRole);
  
  // Default to MEMBER permissions if role not found (safety fallback)
  const effectiveRole = role || UserRole.MEMBER;
  
  const permissions = ROLE_PERMISSIONS[effectiveRole];
  return permissions ? permissions.includes(permission) : false;
};
