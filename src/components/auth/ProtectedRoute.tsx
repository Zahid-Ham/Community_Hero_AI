import React from 'react';
import { useAuth } from '../../features/auth/useAuth';
import { LoginView } from './LoginView';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm text-center">
          {/* Indian Tricolor Pulse Spinner */}
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-600 border-r-transparent border-b-emerald-600 border-l-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-slate-50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-800 animate-ping"></div>
            </div>
          </div>
          <h2 className="font-display font-medium text-lg text-slate-900 tracking-tight">Community Hero of India</h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-widest uppercase">Syncing National Grievance Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return <>{children}</>;
}
