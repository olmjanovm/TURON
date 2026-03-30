import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRoleEnum } from '@turon/shared';
import { UnauthorizedState } from '../ui/FeedbackStates';

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

  if (!allowedRoles.includes(user.role)) {
    return <UnauthorizedState />;
  }

  return <>{children}</>;
};
