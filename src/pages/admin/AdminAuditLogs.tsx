import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { FileText, ShieldAlert } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { auditLogs } = usePlatform();

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Immutable Audit Trail Logs</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full compliance record of administrative actions, payouts, plan modifications, and user state changes.
          </p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Log ID</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Metadata Details</th>
                <th className="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="p-3.5 font-mono text-slate-500 text-[11px]">{log.id}</td>
                  <td className="p-3.5 font-semibold text-slate-300">{log.actor_email}</td>
                  <td className="p-3.5 font-bold text-amber-400 font-mono">{log.action}</td>
                  <td className="p-3.5 text-slate-400 capitalize">{log.entity}</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300">
                    {JSON.stringify(log.details || {})}
                  </td>
                  <td className="p-3.5 text-slate-500">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
