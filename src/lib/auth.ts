import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function hasRole(role: UserRole) {
  const user = await getCurrentUser();
  return user?.role === role;
}

export async function hasAnyRole(roles: UserRole[]) {
  const user = await getCurrentUser();
  return user && roles.includes(user.role);
}

export async function hasAllRoles(roles: UserRole[]) {
  const user = await getCurrentUser();
  return user && roles.every(role => user.role === role);
}

export function checkRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    ADMIN: 4,
    MANAGER: 3,
    TESTER: 2,
    VIEWER: 1,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
} 