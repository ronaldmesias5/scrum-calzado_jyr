import type { UserResponse } from '@/types/auth';

export function isJefe(user: UserResponse | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role_name === 'admin' ||
    (user.role_name === 'employee' && user.occupation === 'jefe')
  );
}