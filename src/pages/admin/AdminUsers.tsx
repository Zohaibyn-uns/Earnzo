import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Users, Shield, Ban, CheckCircle, Search } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { allProfiles, updateUserStatus, updateUserRole } = usePlatform();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = allProfiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">User Directory & Roles</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit member accounts, roles, access statuses, and referral links.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search name, email, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 text-xs"
            leftElement={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Referral Code</th>
                <th className="p-3.5">Joined Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40">
                  <td className="p-3.5">
                    <div className="font-bold text-white">{p.full_name}</div>
                    <div className="text-[11px] text-slate-400">{p.email}</div>
                    <div className="text-[10px] text-slate-500">{p.phone || 'No phone'}</div>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={p.role}
                      onChange={(e: any) => updateUserRole(p.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1 font-medium"
                    >
                      <option value="user">User</option>
                      <option value="support">Support</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'suspended'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300 font-bold">{p.referral_code}</td>
                  <td className="p-3.5 text-slate-400">{formatDate(p.created_at).split(',')[0]}</td>
                  <td className="p-3.5 text-right space-x-1.5">
                    {p.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 text-xs"
                        onClick={() => updateUserStatus(p.id, 'suspended')}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 text-xs"
                        onClick={() => updateUserStatus(p.id, 'active')}
                      >
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
