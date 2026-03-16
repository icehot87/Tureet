export enum UserRole {
  ADMIN = 'ADMIN',
  TESTER = 'TESTER',
  VIEWER = 'VIEWER',
}

export function canEdit(userRole?: string): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.TESTER;
}

export function canDelete(userRole?: string): boolean {
  return userRole === UserRole.ADMIN;
}

export function canManageUsers(userRole?: string): boolean {
  return userRole === UserRole.ADMIN;
}

export function canExecuteTests(userRole?: string): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.TESTER;
}
