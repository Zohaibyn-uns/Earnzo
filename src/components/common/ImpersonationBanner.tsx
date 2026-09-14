import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonatorAdmin, user, exitImpersonation } = useAuth();

  if (!isImpersonating || !user) {
    return null;
  }

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-amber-500 text-slate-950 font-medium px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 border-b border-amber-600 animate-in fade-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-2.5 text-xs sm:text-sm">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-slate-950" />
        <div>
          <span className="font-bold uppercase tracking-wider bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] mr-2">
            Impersonation Mode
          </span>
          <span>
            Acting as User: <strong className="font-bold">{user.full_name || 'User'}</strong> ({user.email || user.id})
          </span>
          {impersonatorAdmin && (
            <span className="hidden md:inline text-slate-900/80 ml-2">
              • Admin: {impersonatorAdmin.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={exitImpersonation}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-amber-400 hover:bg-slate-900 text-xs font-semibold rounded shadow-sm hover:shadow transition-colors"
          title="Exit impersonation and return to Admin Panel"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit User Mode</span>
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
