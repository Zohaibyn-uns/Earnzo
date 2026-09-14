import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import {
  FileText,
  ShieldAlert,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminAuditLogs: React.FC = () => {
  const { auditLogs, refetchData, isLoading } = usePlatform();

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;

      return matchesSearch && matchesEntity;
    });
  }, [auditLogs, searchTerm, entityFilter]);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Immutable Security & Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic ledger of administrator actions, impersonation events, user status overrides, and system settings modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchData()}
            isLoading={isLoading}
            className="text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh Ledger</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Search action, actor email, entity ID, metadata..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 text-xs"
            leftElement={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
        >
          <option value="all">All Entities</option>
          <option value="settings">Settings</option>
          <option value="profiles">User Profiles</option>
          <option value="impersonation">Impersonation Events</option>
          <option value="plans">Plans & Pricing</option>
          <option value="withdrawals">Withdrawals</option>
          <option value="videos">Sponsored Tasks</option>
          <option value="website_content">Page Builder Content</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-8"></th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Actor (Admin)</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Metadata Snapshot</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Log ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No audit log records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const actionStr = String(log.action || '');

                  const isSecurityAlert =
                    actionStr.includes('impersonat') ||
                    actionStr.includes('banned') ||
                    actionStr.includes('suspend') ||
                    actionStr.includes('role');

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`hover:bg-slate-900/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-900/60' : ''
                        }`}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <td className="p-3.5 text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              isSecurityAlert
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-900 text-slate-200 border border-slate-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="p-3.5 font-semibold text-slate-300">
                          {log.actor_email || 'system@earnzo.com'}
                        </td>

                        <td className="p-3.5">
                          <span className="capitalize text-slate-400 font-medium">
                            {log.entity}
                          </span>
                          {log.entity_id && (
                            <span className="block text-[10px] text-slate-500 font-mono">
                              ID: {log.entity_id.slice(0, 8)}...
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                          {JSON.stringify(log.details || {})}
                        </td>

                        <td className="p-3.5 text-slate-400">{formatDate(log.created_at)}</td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log.id, log.id);
                            }}
                            className="font-mono text-[11px] text-slate-500 hover:text-indigo-400 inline-flex items-center gap-1 group"
                            title="Copy Log ID"
                          >
                            <span>{log.id.slice(0, 8)}</span>
                            {copiedId === log.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/80 border-b border-slate-800">
                          <td colSpan={7} className="p-4 pl-12 space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Complete Audit Payload & Metadata
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(JSON.stringify(log, null, 2), `payload-${log.id}`)}
                                className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 h-auto"
                              >
                                {copiedId === `payload-${log.id}` ? 'Copied' : 'Copy JSON'}
                              </Button>
                            </div>
                            <pre className="p-3 bg-slate-900 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                              {JSON.stringify(log, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
