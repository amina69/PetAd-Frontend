import { type UserRole } from '../types/auth';

// For now, we will create a "dummy" hook that we can connect 
// to the real Auth system later.
export const useRoleGuard = (userRole?: UserRole) => {
  
  // If no user is passed, we assume they are a basic USER
  const role = userRole || 'USER';

  return {
    role,
    isAdmin: role === 'ADMIN',
    isShelter: role === 'SHELTER',
    isUser: role === 'USER',
    // canApprove is true for ADMIN or SHELTER
    canApprove: role === 'ADMIN' || role === 'SHELTER',
  };
};