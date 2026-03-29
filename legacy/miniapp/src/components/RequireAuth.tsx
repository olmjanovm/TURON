import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function RequireAuth({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
    const { role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}
