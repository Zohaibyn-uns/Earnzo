import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '../../context/PlatformContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Users,
  Shield,
  Ban,
  CheckCircle,
  Search,
  ExternalLink,
  Eye,
  X,
  CreditCard,
  Wallet,
  UserCheck,
  Clock,
  LogIn,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { Profile, Membership, WalletAccount, Withdrawal, Referral, WalletTransaction } from '../../types/database';

export const AdminUsers: React.FC = () => {
  const {
    allProfiles,
    allMemberships,
    allWallets,
    withdrawals,
    referrals,
    transactions,
    plans,
    updateUserStatus,
    updateUserRole,
  } = usePlatform();
  const { user: currentAdmin, impersonateUser } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    return allProfiles.filter((p) => {
      const matchesSearch =
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referral_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm));

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [allProfiles, searchTerm, statusFilter, roleFilter]);

  const handleImpersonate = async (targetUser: Profile) => {
    if (targetUser.id === currentAdmin?.id) {
      alert('You are already logged into your own account.');
      return;
    }
    if (targetUser.role === 'admin' || targetUser.email.toLowerCase() === 'admin@earnzo.com') {
      alert('Security policy: Administrators cannot impersonate other administrators.');
      return;
    }

    const confirmed = window.confirm(
      `Confirm Login as User:\nYou are about to enter ${targetUser.full_name}'s account (${targetUser.email}).\n\nAll actions will be audit-logged. An Exit Banner will be pinned to the top of your screen.`
    );
    if (!confirmed) return;

    await impersonateUser(targetUser);
    navigate('/dashboard');
  };

  // Helper stats for modal
  const userStats = useMemo(() => {
    if (!selectedUser) return null;
    const userId = selectedUser.id;
    const membership = allMemberships.find(
      (m) => m.user_id === userId && m.status === 'active' && new Date(m.expires_at) > new Date()
    );
    const activePlan = membership ? plans.find((p) => p.id === membership.plan_id) : null;
    const wallet = allWallets[userId] || {
      balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
    };
    const userReferrals = referrals.filter((r) => r.referrer_id === userId);
    const qualifiedReferrals = userReferrals.filter((r) => r.is_qualified || r.status === 'qualified');
    const userWithdrawals = withdrawals.filter((w) => w.user_id === userId);
    const userTransactions = transactions.filter((t) => t.user_id === userId);

    return {
      membership,
      activePlan,
      wallet,
      userReferrals,
      qualifiedReferrals,
      userWithdrawals,
      userTransactions,
    };
  }, [selectedUser, allMemberships, allWallets, referrals, withdrawals, transactions, plans]);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">User Management & Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime database-driven control of user accounts, status, impersonation, and comprehensive details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <Input
              placeholder="Search name, email, ID, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 text-xs"
              leftElement={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="banned">Terminated Only</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="support">Support</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Account ID</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Referral Code</th>
                <th className="p-3.5">Registered</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No member profiles found matching your search filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isSelf = Boolean(
                    (currentAdmin?.id && p.id === currentAdmin.id) ||
                    (currentAdmin?.email && p.email?.toLowerCase() === currentAdmin.email?.toLowerCase())
                  );
                  const isRootAdmin = p.email?.toLowerCase() === 'admin@earnzo.com';

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{p.full_name}</span>
                          {isSelf && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                              You
                            </span>
                          )}
                          {isRootAdmin && !isSelf && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                              Root
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{p.email}</div>
                        <div className="text-[10px] text-slate-500">{p.phone || 'No phone'}</div>
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handleCopy(p.id, p.id)}
                          className="font-mono text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 group"
                          title="Click to copy full UUID"
                        >
                          <span>{p.id.slice(0, 8)}...</span>
                          {copiedId === p.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <select
                          value={p.role}
                          disabled={isSelf || isRootAdmin}
                          onChange={(e: any) => updateUserRole(p.id, e.target.value)}
                          className={`bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1 font-medium ${
                            isSelf || isRootAdmin ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
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
                      <td className="p-3.5 text-slate-400">{formatDate(p.created_at)}</td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-2 py-1"
                            onClick={() => setSelectedUser(p)}
                            title="Inspect complete account history & stats"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Details</span>
                          </Button>

                          {!isSelf && p.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300 text-xs px-2 py-1"
                              onClick={() => handleImpersonate(p)}
                              title="Enter user account securely without password"
                            >
                              <LogIn className="w-3.5 h-3.5 mr-1" />
                              <span>Login as User</span>
                            </Button>
                          )}

                          {!isSelf && !isRootAdmin && (
                            <>
                              {p.status === 'active' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 text-xs px-2 py-1"
                                    onClick={() => updateUserStatus(p.id, 'suspended')}
                                  >
                                    Suspend
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs px-2 py-1"
                                    onClick={() => updateUserStatus(p.id, 'banned')}
                                  >
                                    Terminate
                                  </Button>
                                </>
                              )}
                              {p.status === 'suspended' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 text-xs px-2 py-1"
                                    onClick={() => updateUserStatus(p.id, 'active')}
                                  >
                                    Activate
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs px-2 py-1"
                                    onClick={() => updateUserStatus(p.id, 'banned')}
                                  >
                                    Terminate
                                  </Button>
                                </>
                              )}
                              {p.status === 'banned' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 text-xs px-2 py-1"
                                  onClick={() => updateUserStatus(p.id, 'active')}
                                >
                                  Reactivate
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal / Drawer */}
      {selectedUser && userStats && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{selectedUser.full_name}</h3>
                  <Badge
                    variant={
                      selectedUser.status === 'active'
                        ? 'success'
                        : selectedUser.status === 'suspended'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {selectedUser.status}
                  </Badge>
                  <Badge variant="neutral" size="sm" className="uppercase">
                    {selectedUser.role}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Impersonation CTA */}
            {selectedUser.id !== currentAdmin?.id && selectedUser.role !== 'admin' && (
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
                <div className="text-xs">
                  <p className="font-bold text-indigo-300">Fast Impersonation</p>
                  <p className="text-slate-400">Launch member dashboard as this user without entering passwords.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleImpersonate(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="text-xs"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  <span>Login as User</span>
                </Button>
              </div>
            )}

            {/* Metric Grids */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Wallet Balance</p>
                <p className="text-base font-black text-emerald-400 mt-1">
                  Rs. {userStats.wallet.balance.toFixed(2)}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Earned</p>
                <p className="text-base font-black text-white mt-1">
                  Rs. {userStats.wallet.total_earned.toFixed(2)}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Withdrawn</p>
                <p className="text-base font-black text-slate-300 mt-1">
                  Rs. {userStats.wallet.total_withdrawn.toFixed(2)}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Referrals</p>
                <p className="text-base font-black text-indigo-400 mt-1">
                  {userStats.userReferrals.length}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({userStats.qualifiedReferrals.length} qualified)
                  </span>
                </p>
              </div>
            </div>

            {/* Account & Membership Info */}
            <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl text-xs">
              <h4 className="font-bold text-white text-sm">Account & Membership Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500">Account UUID:</span>{' '}
                  <span className="font-mono text-slate-300 text-[11px] break-all">{selectedUser.id}</span>
                </div>
                <div>
                  <span className="text-slate-500">Phone Number:</span>{' '}
                  <span className="font-semibold">{selectedUser.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Referral Code:</span>{' '}
                  <span className="font-mono font-bold text-indigo-300">{selectedUser.referral_code}</span>
                </div>
                <div>
                  <span className="text-slate-500">Registered On:</span>{' '}
                  <span>{formatDate(selectedUser.created_at)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Current Plan:</span>{' '}
                  <span className="font-bold text-white">
                    {userStats.activePlan ? userStats.activePlan.name : 'Free / No Plan'}
                  </span>
                </div>
                {userStats.membership && (
                  <div>
                    <span className="text-slate-500">Plan Expiry:</span>{' '}
                    <span>{formatDate(userStats.membership.expires_at).split(',')[0]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Change Controls */}
            {selectedUser.id !== currentAdmin?.id && selectedUser.email.toLowerCase() !== 'admin@earnzo.com' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-400">Direct Status Actions:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedUser.status === 'active' ? 'primary' : 'outline'}
                    size="sm"
                    disabled={selectedUser.status === 'active'}
                    onClick={() => {
                      updateUserStatus(selectedUser.id, 'active');
                      setSelectedUser({ ...selectedUser, status: 'active' });
                    }}
                    className="text-xs"
                  >
                    Activate Account
                  </Button>
                  <Button
                    variant={selectedUser.status === 'suspended' ? 'primary' : 'outline'}
                    size="sm"
                    disabled={selectedUser.status === 'suspended'}
                    onClick={() => {
                      updateUserStatus(selectedUser.id, 'suspended');
                      setSelectedUser({ ...selectedUser, status: 'suspended' });
                    }}
                    className="text-xs text-amber-400 border-amber-500/40"
                  >
                    Suspend Account
                  </Button>
                  <Button
                    variant={selectedUser.status === 'banned' ? 'primary' : 'outline'}
                    size="sm"
                    disabled={selectedUser.status === 'banned'}
                    onClick={() => {
                      updateUserStatus(selectedUser.id, 'banned');
                      setSelectedUser({ ...selectedUser, status: 'banned' });
                    }}
                    className="text-xs text-rose-400 border-rose-500/40"
                  >
                    Terminate Account
                  </Button>
                </div>
              </div>
            )}

            {/* Footer Close */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
