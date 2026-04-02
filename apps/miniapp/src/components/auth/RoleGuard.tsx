import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRoleEnum } from '@turon/shared';
import { UnauthorizedState } from '../ui/FeedbackStates';
import { getRoleHomePath, normalizeRole } from '../../features/auth/roleRouting';

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRoleEnum[];
}

export const RoleGuard: React.FC<Props> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Should generally be caught by AppBootstrapGate, but just in case
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const normalizedRole = normalizeRole(user.role);

  if (!normalizedRole) {
    return <UnauthorizedState />;
  }

  if (!allowedRoles.includes(normalizedRole)) {
    const fallbackPath = getRoleHomePath(normalizedRole);

    if (fallbackPath) {
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }

    return <UnauthorizedState />;
  }

  return <>{children}</>;
};
