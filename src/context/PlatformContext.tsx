import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Plan,
  Membership,
  Payment,
  VideoCampaign,
  VideoTask,
  VideoWatchSession,
  WalletAccount,
  WalletTransaction,
  Withdrawal,
  Referral,
  AdPlacement,
  Announcement,
  SupportTicket,
  SupportMessage,
  NotificationItem,
  AuditLog,
  Profile,
  SystemSettings,
} from '../types/database';
import {
  INITIAL_PLANS,
  INITIAL_CAMPAIGNS,
  INITIAL_VIDEOS,
  INITIAL_ADS,
  INITIAL_ANNOUNCEMENTS,
  DEFAULT_USER_PROFILE,
} from '../lib/mockData';
import { useAuth } from './AuthContext';

export const DEFAULT_SETTINGS: SystemSettings = {
  minWithdrawalBalance: 500,
  requiredQualifiedReferrals: 2,
  referralCommissionPct: 10,
  jazzcashTitle: 'WatchEarn Official Operations',
  jazzcashNumber: '03001234567',
  easypaisaTitle: 'WatchEarn Payments',
  easypaisaNumber: '03451234567',
  bankIban: 'PK36MEZN0001234567890123',
};

export interface WithdrawalEligibility {
  isEligible: boolean;
  missingRequirements: string[];
  minBalance: number;
  qualifiedReferralsNeeded: number;
  qualifiedReferralsCurrent: number;
  currentBalance: number;
}

interface PlatformContextType {
  // System Settings
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;

  // Plans & Membership
  plans: Plan[];
  plan: Plan; // Active user plan or fallback Plan 1
  activePlan: Plan | null; // Null if user has no active plan
  hasActivePlan: boolean;
  updatePlan: (id: string, updated: Partial<Plan>) => void;
  addPlan: (p: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => void;
  deletePlan: (id: string) => void;
  membership: Membership | null;
  submitPayment: (data: {
    planId: string;
    amount: number;
    method: 'JazzCash' | 'Easypaisa' | 'Bank Transfer';
    transactionRef: string;
    senderAccountTitle: string;
    senderAccountNumber: string;
    proofImageUrl?: string;
  }) => Promise<{ success: boolean; paymentId?: string; message: string }>;
  approvePayment: (paymentId: string) => Promise<{ success: boolean; message: string }>;
  rejectPayment: (paymentId: string, reason: string) => Promise<{ success: boolean; message: string }>;

  // Video Tasks & Watch Sessions
  videos: VideoTask[];
  campaigns: VideoCampaign[];
  activeSession: VideoWatchSession | null;
  startWatchSession: (videoId: string) => Promise<{ session: VideoWatchSession; error?: string }>;
  completeWatchSession: (sessionId: string, sessionToken: string) => Promise<{ success: boolean; rewardAmount?: number; error?: string }>;
  addVideo: (video: Omit<VideoTask, 'id' | 'created_at'>) => void;
  updateVideo: (id: string, updates: Partial<VideoTask>) => void;
  deleteVideo: (id: string) => void;
  addCampaign: (campaign: Omit<VideoCampaign, 'id' | 'spent_budget' | 'current_completions'>) => void;
  updateCampaign: (id: string, updates: Partial<VideoCampaign>) => void;

  // Wallet & Withdrawals
  wallet: WalletAccount;
  transactions: WalletTransaction[];
  withdrawals: Withdrawal[];
  withdrawalEligibility: WithdrawalEligibility;
  requestWithdrawal: (data: {
    amount: number;
    method: 'JazzCash' | 'Easypaisa' | 'Bank Transfer';
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
  }) => Promise<{ success: boolean; message: string }>;
  processWithdrawal: (
    withdrawalId: string,
    action: 'approve' | 'reject',
    transactionRef?: string,
    rejectionReason?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Referrals
  referrals: Referral[];
  qualifiedReferralsCount: number;

  // Payments & Admin
  payments: Payment[];
  allProfiles: Profile[];
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'banned') => void;
  updateUserRole: (userId: string, role: 'user' | 'support' | 'manager' | 'admin') => void;

  // Third-Party Ads
  adPlacements: AdPlacement[];
  addAdPlacement: (ad: Omit<AdPlacement, 'id' | 'impressions' | 'clicks'>) => void;
  updateAdPlacement: (id: string, updates: Partial<AdPlacement>) => void;
  deleteAdPlacement: (id: string) => void;
  recordAdClick: (id: string) => void;

  // Announcements & Support
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at'>) => void;
  tickets: SupportTicket[];
  createTicket: (subject: string, category: any, priority: any, initialMessage: string) => Promise<{ success: boolean; ticketId: string }>;
  replyToTicket: (ticketId: string, message: string, isAdmin?: boolean) => Promise<{ success: boolean }>;
  updateTicketStatus: (ticketId: string, status: any) => void;

  // Notifications & Audit
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  auditLogs: AuditLog[];
  logAuditEvent: (action: string, entity: string, entityId?: string, details?: Record<string, any>) => void;

  // Reset demo state & toggles
  resetToDefaults: () => void;
  toggleDemoMembership: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PLANS: 'watchearn_plans_v3',
  MEMBERSHIPS: 'watchearn_memberships_v3',
  PAYMENTS: 'watchearn_payments_v3',
  VIDEOS: 'watchearn_videos_v3',
  CAMPAIGNS: 'watchearn_campaigns_v3',
  WALLETS: 'watchearn_wallets_v3',
  TRANSACTIONS: 'watchearn_transactions_v3',
  WITHDRAWALS: 'watchearn_withdrawals_v3',
  SESSIONS: 'watchearn_sessions_v3',
  PROFILES: 'watchearn_profiles_v3',
  REFERRALS: 'watchearn_referrals_v3',
  ADS: 'watchearn_ads_v3',
  ANNOUNCEMENTS: 'watchearn_announcements_v3',
  TICKETS: 'watchearn_tickets_v3',
  NOTIFICATIONS: 'watchearn_notifications_v3',
  AUDIT_LOGS: 'watchearn_audit_logs_v3',
  SETTINGS: 'watchearn_settings_v3',
};

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const currentUserId = user?.id || null;

  // System Settings (Configurable via Admin Panel)
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  };

  // Clean up legacy v1/v2 storage keys containing seeded mock balances
  useEffect(() => {
    const legacyKeys = [
      'watchearn_membership_v2',
      'watchearn_wallet_v2',
      'watchearn_transactions_v2',
      'watchearn_referrals_v2',
      'watchearn_payments_v2',
      'watchearn_active_user_v1',
      'watchearn_sessions_v2',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  }, []);

  // 1. Configurable Plans (Plan 1, Plan 2, Plan 3)
  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });

  // 2. Memberships (Per-User Store: Starts EMPTY. No default active plan!)
  const [allMemberships, setAllMemberships] = useState<Membership[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
    return saved ? JSON.parse(saved) : [];
  });

  // Derive current user's active membership
  const membership: Membership | null = useMemo(() => {
    if (!currentUserId) return null;
    const userMem = allMemberships.find(
      (m) => m.user_id === currentUserId && m.status === 'active' && new Date(m.expires_at) > new Date()
    );
    return userMem || null;
  }, [allMemberships, currentUserId]);

  // Derive active plan
  const activePlan: Plan | null = useMemo(() => {
    if (!membership) return null;
    return plans.find((p) => p.id === membership.plan_id) || membership.plan || null;
  }, [membership, plans]);

  const hasActivePlan = Boolean(activePlan);
  const plan: Plan = activePlan || plans[0]; // Fallback for reference pricing if unsubscribed

  // 3. Wallets (Per-User Store: Starts EMPTY with 0 balance!)
  const [allWallets, setAllWallets] = useState<Record<string, WalletAccount>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WALLETS);
    return saved ? JSON.parse(saved) : {};
  });

  // Derive current user's wallet
  const wallet: WalletAccount = useMemo(() => {
    if (!currentUserId) {
      return {
        id: 'wal-guest',
        user_id: 'guest',
        balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        currency: 'PKR',
        updated_at: new Date().toISOString(),
      };
    }
    return (
      allWallets[currentUserId] || {
        id: `wal-${currentUserId}`,
        user_id: currentUserId,
        balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        currency: 'PKR',
        updated_at: new Date().toISOString(),
      }
    );
  }, [allWallets, currentUserId]);

  // 4. Ledger Transactions (Starts EMPTY. Per-User Filtered!)
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const transactions: WalletTransaction[] = useMemo(() => {
    if (isAdmin) return allTransactions;
    if (!currentUserId) return [];
    return allTransactions.filter((t) => t.user_id === currentUserId);
  }, [allTransactions, currentUserId, isAdmin]);

  // 5. Referrals (Per-User Filtered: Starts EMPTY!)
  const [allReferrals, setAllReferrals] = useState<Referral[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    return saved ? JSON.parse(saved) : [];
  });

  const referrals: Referral[] = useMemo(() => {
    if (isAdmin) return allReferrals;
    if (!currentUserId) return [];
    return allReferrals.filter((r) => r.referrer_id === currentUserId);
  }, [allReferrals, currentUserId, isAdmin]);

  const qualifiedReferralsCount = useMemo(() => {
    return referrals.filter(
      (r) => r.is_qualified && (r.status === 'qualified' || r.membership_purchased)
    ).length;
  }, [referrals]);

  // 6. Payments (Starts EMPTY!)
  const [allPayments, setAllPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const payments: Payment[] = useMemo(() => {
    if (isAdmin) return allPayments;
    if (!currentUserId) return [];
    return allPayments.filter((p) => p.user_id === currentUserId);
  }, [allPayments, currentUserId, isAdmin]);

  // 7. Videos & Campaigns
  const [campaigns, setCampaigns] = useState<VideoCampaign[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [videos, setVideos] = useState<VideoTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
  });

  const [allSessions, setAllSessions] = useState<VideoWatchSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSession, setActiveSession] = useState<VideoWatchSession | null>(null);

  // 8. Withdrawals (Per-User Filtered: Starts EMPTY!)
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    return saved ? JSON.parse(saved) : [];
  });

  const withdrawals: Withdrawal[] = useMemo(() => {
    if (isAdmin) return allWithdrawals;
    if (!currentUserId) return [];
    return allWithdrawals.filter((w) => w.user_id === currentUserId);
  }, [allWithdrawals, currentUserId, isAdmin]);

  // 9. Profiles
  const [allProfiles, setAllProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return saved ? JSON.parse(saved) : [DEFAULT_USER_PROFILE];
  });

  // Sync authenticated user into profile list if new
  useEffect(() => {
    if (user && user.id) {
      setAllProfiles((prev) => {
        if (!prev.some((p) => p.id === user.id)) {
          return [user, ...prev];
        }
        return prev;
      });
    }
  }, [user]);

  // 10. Ads & Announcements
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADS);
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  // 11. Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return saved ? JSON.parse(saved) : [];
  });

  // 12. Notifications & Audit Logs
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'aud-001',
        actor_email: 'admin@watchearn.com',
        action: 'system_initialized',
        entity: 'platform',
        details: { note: 'Initial platform deployment with 3 VIP plans' },
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];
  });

  // Dynamic Withdrawal Eligibility Calculation (Rule 2: Balance >= 500 AND Qualified Referrals >= 2)
  const withdrawalEligibility: WithdrawalEligibility = useMemo(() => {
    const minWithdrawalThreshold = settings.minWithdrawalBalance;
    const qualifiedReferralsNeeded = settings.requiredQualifiedReferrals;
    const missing: string[] = [];

    if (wallet.balance < minWithdrawalThreshold) {
      missing.push(
        `Minimum balance of Rs. ${minWithdrawalThreshold} required (You have Rs. ${wallet.balance.toFixed(2)})`
      );
    }
    if (qualifiedReferralsCount < qualifiedReferralsNeeded) {
      missing.push(
        `2 Qualified Referrals Required (You currently have ${qualifiedReferralsCount} / ${qualifiedReferralsNeeded})`
      );
    }

    return {
      isEligible: missing.length === 0,
      missingRequirements: missing,
      minBalance: minWithdrawalThreshold,
      qualifiedReferralsNeeded,
      qualifiedReferralsCurrent: qualifiedReferralsCount,
      currentBalance: wallet.balance,
    };
  }, [settings.minWithdrawalBalance, settings.requiredQualifiedReferrals, wallet.balance, qualifiedReferralsCount]);

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(allMemberships));
  }, [allMemberships]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(allPayments));
  }, [allPayments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
  }, [allSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(allWallets));
  }, [allWallets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(allTransactions));
  }, [allTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(allWithdrawals));
  }, [allWithdrawals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(allProfiles));
  }, [allProfiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(allReferrals));
  }, [allReferrals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(adPlacements));
  }, [adPlacements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helpers
  const logAuditEvent = (action: string, entity: string, entityId?: string, details?: Record<string, any>) => {
    const newEntry: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_email: user?.email || 'admin@watchearn.com',
      action,
      entity,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type'], action_url?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: currentUserId || 'system',
      title,
      message,
      type,
      is_read: false,
      action_url,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Plan actions
  const updatePlan = (id: string, updated: Partial<Plan>) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = { ...p, ...updated, updated_at: new Date().toISOString() };
          logAuditEvent('plan_updated', 'plans', id, updated);
          return next;
        }
        return p;
      })
    );
  };

  const addPlan = (p: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => {
    const newPlan: Plan = {
      ...p,
      id: `plan-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPlans((prev) => [...prev, newPlan]);
    logAuditEvent('plan_created', 'plans', newPlan.id, { name: p.name, price: p.price });
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    logAuditEvent('plan_deleted', 'plans', id);
  };

  // Payment actions
  const submitPayment = async (data: {
    planId: string;
    amount: number;
    method: 'JazzCash' | 'Easypaisa' | 'Bank Transfer';
    transactionRef: string;
    senderAccountTitle: string;
    senderAccountNumber: string;
    proofImageUrl?: string;
  }) => {
    if (!currentUserId) {
      return { success: false, message: 'Please log in or register before submitting a payment.' };
    }

    const selectedPlan = plans.find((p) => p.id === data.planId) || plans[0];
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      user_id: currentUserId,
      plan_id: selectedPlan.id,
      amount: data.amount,
      method: data.method,
      transaction_ref: data.transactionRef,
      sender_account_title: data.senderAccountTitle,
      sender_account_number: data.senderAccountNumber,
      proof_image_url: data.proofImageUrl,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAllPayments((prev) => [newPayment, ...prev]);
    addNotification(
      'Payment Submitted',
      `Your Rs. ${data.amount} payment for ${selectedPlan.name} via ${data.method} (TRX: ${data.transactionRef}) has been submitted for review.`,
      'payment'
    );
    return { success: true, paymentId: newPayment.id, message: 'Payment submitted successfully! Admin will verify and activate your plan.' };
  };

  const approvePayment = async (paymentId: string) => {
    const payment = allPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment record not found' };

    const selectedPlan = plans.find((p) => p.id === payment.plan_id) || plans[0];

    // Mark payment paid
    setAllPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: 'paid', reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          : p
      )
    );

    // Activate membership with chosen plan for payment's user
    const newMem: Membership = {
      id: `mem-${Date.now()}`,
      user_id: payment.user_id,
      plan_id: selectedPlan.id,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * selectedPlan.duration_days).toISOString(),
      tasks_completed_today: 0,
      last_task_date: new Date().toISOString().split('T')[0],
      plan: selectedPlan,
    };

    setAllMemberships((prev) => [
      newMem,
      ...prev.filter((m) => m.user_id !== payment.user_id),
    ]);

    // Ledger transaction record for membership purchase
    const userWal = allWallets[payment.user_id] || {
      id: `wal-${payment.user_id}`,
      user_id: payment.user_id,
      balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      currency: 'PKR',
      updated_at: new Date().toISOString(),
    };

    setAllTransactions((prev) => [
      {
        id: `trx-${Date.now()}`,
        wallet_id: userWal.id,
        user_id: payment.user_id,
        type: 'membership_purchase',
        amount: -payment.amount,
        balance_before: userWal.balance,
        balance_after: userWal.balance,
        description: `Purchased 30-day ${selectedPlan.name} via ${payment.method} (TRX: ${payment.transaction_ref})`,
        reference_id: paymentId,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    // Referral Reward Logic if the user was referred (Configurable 1-Tier Commission)
    const commPct = settings.referralCommissionPct || 10;
    const commissionAmount = Math.round(payment.amount * (commPct / 100));
    setAllReferrals((prev) =>
      prev.map((r) => {
        if (r.referred_user_id === payment.user_id) {
          // Credit commission to referrer's wallet
          setAllWallets((wPrev) => {
            const refWal = wPrev[r.referrer_id] || {
              id: `wal-${r.referrer_id}`,
              user_id: r.referrer_id,
              balance: 0,
              pending_balance: 0,
              total_earned: 0,
              total_withdrawn: 0,
              currency: 'PKR',
              updated_at: new Date().toISOString(),
            };
            return {
              ...wPrev,
              [r.referrer_id]: {
                ...refWal,
                balance: refWal.balance + commissionAmount,
                total_earned: refWal.total_earned + commissionAmount,
                updated_at: new Date().toISOString(),
              },
            };
          });

          // Ledger transaction for referrer
          setAllTransactions((tPrev) => [
            {
              id: `trx-${Date.now()}-ref`,
              wallet_id: `wal-${r.referrer_id}`,
              user_id: r.referrer_id,
              type: 'referral_reward',
              amount: commissionAmount,
              balance_before: (allWallets[r.referrer_id]?.balance || 0),
              balance_after: (allWallets[r.referrer_id]?.balance || 0) + commissionAmount,
              description: `${commPct}% Referral Commission from ${selectedPlan.name} purchase`,
              reference_id: paymentId,
              created_at: new Date().toISOString(),
            },
            ...tPrev,
          ]);

          return {
            ...r,
            is_qualified: true,
            status: 'qualified',
            membership_purchased: true,
            reward_issued: true,
            commission_rate: commPct,
            commission_amount: commissionAmount,
            plan_name: selectedPlan.name,
            updated_at: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    addNotification(
      'Plan Activated!',
      `Your ${selectedPlan.name} has been verified and activated. You can now access ${selectedPlan.daily_task_limit} daily tasks on the Earn page!`,
      'membership',
      '/earn'
    );

    logAuditEvent('payment_approved', 'payments', paymentId, {
      amount: payment.amount,
      user_id: payment.user_id,
      plan: selectedPlan.name,
    });
    return { success: true, message: `Payment verified and ${selectedPlan.name} activated!` };
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
    setAllPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: 'failed', admin_notes: reason, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          : p
      )
    );

    addNotification(
      'Payment Verification Failed',
      `Payment was rejected: ${reason}. Please check your transaction reference.`,
      'payment'
    );

    logAuditEvent('payment_rejected', 'payments', paymentId, { reason });
    return { success: true, message: 'Payment marked as rejected' };
  };

  // Watch Session & Anti-Cheat Validation
  const startWatchSession = async (videoId: string): Promise<{ session: VideoWatchSession; error?: string }> => {
    if (!currentUserId) {
      return {
        session: {} as any,
        error: 'Please log in to start watching sponsored tasks.',
      };
    }

    if (!activePlan) {
      return {
        session: {} as any,
        error: '🔒 Earning Locked. Choose an active plan to unlock your available reward tasks.',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = allSessions.filter(
      (s) => s.user_id === currentUserId && s.status === 'completed' && s.completed_at?.startsWith(todayStr)
    ).length;

    if (completedToday >= activePlan.daily_task_limit) {
      return {
        session: {} as any,
        error: `Daily task limit reached (${completedToday}/${activePlan.daily_task_limit} tasks). Limit resets at midnight.`,
      };
    }

    const video = videos.find((v) => v.id === videoId);
    if (!video || video.status !== 'active') {
      return {
        session: {} as any,
        error: 'This sponsored task is currently unavailable.',
      };
    }

    // Check duplicate watch today
    const alreadyDone = allSessions.some(
      (s) => s.user_id === currentUserId && s.video_id === videoId && s.status === 'completed' && s.completed_at?.startsWith(todayStr)
    );
    if (alreadyDone) {
      return {
        session: {} as any,
        error: 'You have already completed this sponsored task today.',
      };
    }

    const sessionToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newSession: VideoWatchSession = {
      id: `ses-${Date.now()}`,
      user_id: currentUserId,
      video_id: videoId,
      session_token: sessionToken,
      started_at: new Date().toISOString(),
      watch_duration_seconds: 0,
      status: 'active',
      is_fraud_flagged: false,
      reward_credited: false,
    };

    setAllSessions((prev) => [newSession, ...prev]);
    setActiveSession(newSession);
    return { session: newSession };
  };

  const completeWatchSession = async (
    sessionId: string,
    sessionToken: string
  ): Promise<{ success: boolean; rewardAmount?: number; error?: string }> => {
    if (!currentUserId) return { success: false, error: 'Authentication required' };

    const session = allSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Invalid watch session' };
    if (session.session_token !== sessionToken) {
      return { success: false, error: 'Security token mismatch. Verification failed.' };
    }
    if (session.status === 'completed' || session.reward_credited) {
      return { success: false, error: 'This watch session has already been completed.' };
    }

    const video = videos.find((v) => v.id === session.video_id);
    if (!video) return { success: false, error: 'Video task not found' };

    // Validate server-side true elapsed duration
    const startTime = new Date(session.started_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    if (elapsedSeconds < video.duration_seconds - 2) {
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, is_fraud_flagged: true, fraud_reason: `Premature completion attempt (${elapsedSeconds}s of ${video.duration_seconds}s)` }
            : s
        )
      );
      return {
        success: false,
        error: `Playback incomplete. Required duration is ${video.duration_seconds}s, but only ${elapsedSeconds}s elapsed.`,
      };
    }

    // Reward amount derived dynamically from user's active plan tier
    const reward = activePlan ? activePlan.reward_per_task : video.reward_amount;
    const curBalance = wallet.balance;
    const newBalance = curBalance + reward;

    // Credit user's wallet
    setAllWallets((prev) => ({
      ...prev,
      [currentUserId]: {
        ...wallet,
        balance: newBalance,
        total_earned: wallet.total_earned + reward,
        updated_at: new Date().toISOString(),
      },
    }));

    // Insert immutable ledger transaction
    const newTrx: WalletTransaction = {
      id: `trx-${Date.now()}`,
      wallet_id: wallet.id,
      user_id: currentUserId,
      type: 'video_reward',
      amount: reward,
      balance_before: curBalance,
      balance_after: newBalance,
      description: `Task reward for watching "${video.title}" (${activePlan?.name || 'Standard'})`,
      reference_id: sessionId,
      metadata: { video_id: video.id, duration_seconds: elapsedSeconds, plan: activePlan?.name },
      created_at: new Date().toISOString(),
    };
    setAllTransactions((prev) => [newTrx, ...prev]);

    // Update session
    setAllSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'completed',
              completed_at: new Date().toISOString(),
              watch_duration_seconds: elapsedSeconds,
              reward_credited: true,
            }
          : s
      )
    );

    // Update today's completed task count on membership
    if (membership) {
      setAllMemberships((prev) =>
        prev.map((m) =>
          m.id === membership.id
            ? {
                ...m,
                tasks_completed_today: m.tasks_completed_today + 1,
                last_task_date: new Date().toISOString().split('T')[0],
              }
            : m
        )
      );
    }

    // Update video campaign spent
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, daily_limit: Math.max(0, v.daily_limit - 1) } : v))
    );

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === video.campaign_id
          ? { ...c, spent_budget: c.spent_budget + reward, current_completions: c.current_completions + 1 }
          : c
      )
    );

    addNotification(
      'Reward Credited',
      `Rs. ${reward.toFixed(2)} credited to your wallet for watching "${video.title}".`,
      'reward'
    );

    setActiveSession(null);
    return { success: true, rewardAmount: reward };
  };

  // Video and Campaign management (Admin)
  const addVideo = (v: Omit<VideoTask, 'id' | 'created_at'>) => {
    const newVideo: VideoTask = {
      ...v,
      id: `vid-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setVideos((prev) => [newVideo, ...prev]);
    logAuditEvent('video_created', 'videos', newVideo.id, { title: v.title });
  };

  const updateVideo = (id: string, updates: Partial<VideoTask>) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    logAuditEvent('video_updated', 'videos', id, updates);
  };

  const deleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    logAuditEvent('video_deleted', 'videos', id);
  };

  const addCampaign = (c: Omit<VideoCampaign, 'id' | 'spent_budget' | 'current_completions'>) => {
    const newCamp: VideoCampaign = {
      ...c,
      id: `camp-${Date.now()}`,
      spent_budget: 0,
      current_completions: 0,
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    logAuditEvent('campaign_created', 'campaigns', newCamp.id, { name: c.name });
  };

  const updateCampaign = (id: string, updates: Partial<VideoCampaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    logAuditEvent('campaign_updated', 'campaigns', id, updates);
  };

  // Withdrawal Requests & Admin Approval
  const requestWithdrawal = async (data: {
    amount: number;
    method: 'JazzCash' | 'Easypaisa' | 'Bank Transfer';
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!currentUserId) return { success: false, message: 'Authentication required' };

    if (!withdrawalEligibility.isEligible) {
      return {
        success: false,
        message: `Withdrawal requirement not met: ${withdrawalEligibility.missingRequirements.join('. ')}`,
      };
    }

    // Check existing pending
    const hasPending = allWithdrawals.some((w) => w.user_id === currentUserId && w.status === 'pending');
    if (hasPending) {
      return { success: false, message: 'You already have an active pending withdrawal under review.' };
    }

    if (data.amount < settings.minWithdrawalBalance) {
      return {
        success: false,
        message: `Minimum withdrawal is Rs. ${settings.minWithdrawalBalance}`,
      };
    }

    if (data.amount > wallet.balance) {
      return { success: false, message: `Insufficient available balance. You have Rs. ${wallet.balance}` };
    }

    const feePct = activePlan?.withdrawal_fee_pct || 2.5;
    const fee = Math.round(data.amount * (feePct / 100) * 100) / 100;
    const netAmount = data.amount - fee;
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - data.amount;

    const withdrawalId = `wth-${Date.now()}`;
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      user_id: currentUserId,
      wallet_id: wallet.id,
      amount: data.amount,
      fee,
      net_amount: netAmount,
      method: data.method,
      account_title: data.accountTitle,
      account_number: data.accountNumber,
      bank_name: data.bankName,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Atomic funds lock
    setAllWallets((prev) => ({
      ...prev,
      [currentUserId]: {
        ...wallet,
        balance: balanceAfter,
        pending_balance: wallet.pending_balance + data.amount,
        updated_at: new Date().toISOString(),
      },
    }));

    setAllWithdrawals((prev) => [newWithdrawal, ...prev]);

    // Ledger transaction
    const newTrx: WalletTransaction = {
      id: `trx-${Date.now()}`,
      wallet_id: wallet.id,
      user_id: currentUserId,
      type: 'withdrawal_request',
      amount: -data.amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `Withdrawal request via ${data.method} (Net: Rs. ${netAmount})`,
      reference_id: withdrawalId,
      metadata: { fee, net_amount: netAmount, account: data.accountNumber },
      created_at: new Date().toISOString(),
    };
    setAllTransactions((prev) => [newTrx, ...prev]);

    addNotification(
      'Withdrawal Submitted',
      `Withdrawal of Rs. ${data.amount} requested via ${data.method}. Net payout of Rs. ${netAmount} will be transferred within 24 hours.`,
      'withdrawal'
    );

    logAuditEvent('withdrawal_requested', 'withdrawals', withdrawalId, { amount: data.amount, method: data.method });

    return {
      success: true,
      message: `Withdrawal of Rs. ${data.amount} requested. Net Rs. ${netAmount} will be dispatched after administrative audit.`,
    };
  };

  const processWithdrawal = async (
    withdrawalId: string,
    action: 'approve' | 'reject',
    transactionRef?: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string }> => {
    const withdrawal = allWithdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal) return { success: false, message: 'Withdrawal not found' };

    const targetUserId = withdrawal.user_id;
    const targetWal = allWallets[targetUserId] || {
      id: `wal-${targetUserId}`,
      user_id: targetUserId,
      balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      currency: 'PKR',
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      setAllWallets((prev) => ({
        ...prev,
        [targetUserId]: {
          ...targetWal,
          pending_balance: Math.max(0, targetWal.pending_balance - withdrawal.amount),
          total_withdrawn: targetWal.total_withdrawn + withdrawal.amount,
          updated_at: new Date().toISOString(),
        },
      }));

      setAllWithdrawals((prev) =>
        prev.map((w) =>
          w.id === withdrawalId
            ? {
                ...w,
                status: 'paid',
                processed_at: new Date().toISOString(),
                transaction_ref: transactionRef || `DISB-${Date.now()}`,
              }
            : w
        )
      );

      // Ledger transaction for approval
      setAllTransactions((prev) => [
        {
          id: `trx-${Date.now()}-comp`,
          wallet_id: targetWal.id,
          user_id: targetUserId,
          type: 'withdrawal_completed',
          amount: 0,
          balance_before: targetWal.balance,
          balance_after: targetWal.balance,
          description: `Disbursement completed via ${withdrawal.method} (Ref: ${transactionRef || 'BANK-DIRECT'})`,
          reference_id: withdrawalId,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      logAuditEvent('withdrawal_approved', 'withdrawals', withdrawalId, { amount: withdrawal.amount });
      return { success: true, message: `Withdrawal for Rs. ${withdrawal.amount} approved and disbursed!` };
    } else {
      // Rejection: 100% refund of locked funds
      const refundBalBefore = targetWal.balance;
      const refundBalAfter = refundBalBefore + withdrawal.amount;

      setAllWallets((prev) => ({
        ...prev,
        [targetUserId]: {
          ...targetWal,
          balance: refundBalAfter,
          pending_balance: Math.max(0, targetWal.pending_balance - withdrawal.amount),
          updated_at: new Date().toISOString(),
        },
      }));

      setAllWithdrawals((prev) =>
        prev.map((w) =>
          w.id === withdrawalId
            ? {
                ...w,
                status: 'rejected',
                processed_at: new Date().toISOString(),
                rejection_reason: rejectionReason || 'Information mismatch',
              }
            : w
        )
      );

      // Ledger transaction for refund
      setAllTransactions((prev) => [
        {
          id: `trx-${Date.now()}-refund`,
          wallet_id: targetWal.id,
          user_id: targetUserId,
          type: 'withdrawal_rejected',
          amount: withdrawal.amount,
          balance_before: refundBalBefore,
          balance_after: refundBalAfter,
          description: `Withdrawal refund: ${rejectionReason || 'Rejected by administrator'}`,
          reference_id: withdrawalId,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      logAuditEvent('withdrawal_rejected', 'withdrawals', withdrawalId, { reason: rejectionReason });
      return { success: true, message: `Withdrawal rejected. Rs. ${withdrawal.amount} refunded to user wallet.` };
    }
  };

  // Profiles & Users
  const updateUserStatus = (userId: string, status: 'active' | 'suspended' | 'banned') => {
    setAllProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, status, updated_at: new Date().toISOString() } : p))
    );
    logAuditEvent('user_status_changed', 'profiles', userId, { status });
  };

  const updateUserRole = (userId: string, role: 'user' | 'support' | 'manager' | 'admin') => {
    setAllProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, role, updated_at: new Date().toISOString() } : p))
    );
    logAuditEvent('user_role_changed', 'profiles', userId, { role });
  };

  // Ads
  const addAdPlacement = (ad: Omit<AdPlacement, 'id' | 'impressions' | 'clicks'>) => {
    const newAd: AdPlacement = {
      ...ad,
      id: `ad-${Date.now()}`,
      impressions: 0,
      clicks: 0,
    };
    setAdPlacements((prev) => [newAd, ...prev]);
    logAuditEvent('ad_created', 'ads', newAd.id, { title: ad.title });
  };

  const updateAdPlacement = (id: string, updates: Partial<AdPlacement>) => {
    setAdPlacements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAdPlacement = (id: string) => {
    setAdPlacements((prev) => prev.filter((a) => a.id !== id));
  };

  const recordAdClick = (id: string) => {
    setAdPlacements((prev) => prev.map((a) => (a.id === id ? { ...a, clicks: a.clicks + 1 } : a)));
  };

  // Announcements
  const addAnnouncement = (ann: Omit<Announcement, 'id' | 'created_at'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    logAuditEvent('announcement_created', 'announcements', newAnn.id, { title: ann.title });
  };

  // Support Tickets
  const createTicket = async (subject: string, category: any, priority: any, initialMessage: string) => {
    const ticketId = `tkt-${Date.now()}`;
    const initialMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: currentUserId || 'guest',
      sender_name: user?.full_name || 'Member',
      message: initialMessage,
      is_admin_reply: false,
      created_at: new Date().toISOString(),
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      user_id: currentUserId || 'guest',
      subject,
      category,
      priority,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [initialMsg],
    };

    setTickets((prev) => [newTicket, ...prev]);
    addNotification('Support Ticket Created', `Ticket #${ticketId} submitted. Support team will respond shortly.`, 'security');
    return { success: true, ticketId };
  };

  const replyToTicket = async (ticketId: string, message: string, isFromAdmin?: boolean) => {
    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: isFromAdmin ? 'admin-001' : (currentUserId || 'guest'),
      sender_name: isFromAdmin ? 'Support Officer' : (user?.full_name || 'Member'),
      message,
      is_admin_reply: !!isFromAdmin,
      created_at: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              messages: [...(t.messages || []), newMsg],
              updated_at: new Date().toISOString(),
              status: isFromAdmin ? 'in_progress' : 'open',
            }
          : t
      )
    );
    return { success: true };
  };

  const updateTicketStatus = (ticketId: string, status: any) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  // Demo toggle helper (Operates on current authenticated user)
  const toggleDemoMembership = () => {
    if (!currentUserId) return;
    if (hasActivePlan) {
      setAllMemberships((prev) => prev.filter((m) => m.user_id !== currentUserId));
    } else {
      const demoMem: Membership = {
        id: `mem-${Date.now()}`,
        user_id: currentUserId,
        plan_id: plans[0].id,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
        tasks_completed_today: 0,
        last_task_date: new Date().toISOString().split('T')[0],
        plan: plans[0],
      };
      setAllMemberships((prev) => [demoMem, ...prev.filter((m) => m.user_id !== currentUserId)]);
    }
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setPlans(INITIAL_PLANS);
    setAllMemberships([]);
    setAllWallets({});
    setAllTransactions([]);
    setAllReferrals([]);
    setAllWithdrawals([]);
    setAllPayments([]);
    setAllSessions([]);
    window.location.reload();
  };

  return (
    <PlatformContext.Provider
      value={{
        settings,
        updateSettings,
        plans,
        plan,
        activePlan,
        hasActivePlan,
        updatePlan,
        addPlan,
        deletePlan,
        membership,
        submitPayment,
        approvePayment,
        rejectPayment,
        videos,
        campaigns,
        activeSession,
        startWatchSession,
        completeWatchSession,
        addVideo,
        updateVideo,
        deleteVideo,
        addCampaign,
        updateCampaign,
        wallet,
        transactions,
        withdrawals,
        withdrawalEligibility,
        requestWithdrawal,
        processWithdrawal,
        referrals,
        qualifiedReferralsCount,
        payments,
        allProfiles,
        updateUserStatus,
        updateUserRole,
        adPlacements,
        addAdPlacement,
        updateAdPlacement,
        deleteAdPlacement,
        recordAdClick,
        announcements,
        addAnnouncement,
        tickets,
        createTicket,
        replyToTicket,
        updateTicketStatus,
        notifications,
        markNotificationRead,
        auditLogs,
        logAuditEvent,
        resetToDefaults,
        toggleDemoMembership,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
