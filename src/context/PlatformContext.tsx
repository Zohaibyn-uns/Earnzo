import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Plan,
  PaymentClearing,
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
  WebsiteContentItem,
} from '../types/database';
import {
  INITIAL_PLANS,
  INITIAL_CAMPAIGNS,
  INITIAL_VIDEOS,
  INITIAL_ADS,
  INITIAL_ANNOUNCEMENTS,
  DEFAULT_USER_PROFILE,
} from '../lib/mockData';
import { useAuth, isValidUUID } from './AuthContext';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';

export const DEFAULT_SETTINGS: SystemSettings = {
  minWithdrawalBalance: 500,
  requiredQualifiedReferrals: 2,
  referralCommissionPct: 10,
  maintenanceMode: false,
  jazzcashTitle: 'Earnzo Official Operations',
  jazzcashNumber: '03001234567',
  easypaisaTitle: 'Earnzo Payments',
  easypaisaNumber: '03451234567',
  bankIban: 'PK36MEZN0001234567890123',
  general: {
    site_name: 'Earnzo',
    site_description: 'Official Sponsored Video & Engagement Rewards Hub',
    maintenance_mode: false,
    support_email: 'support@earnzo.com',
    support_phone: '+92 300 1234567',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
  },
  referrals: {
    referral_system_enabled: true,
    referral_rewards_enabled: true,
    reward_type: 'fixed',
    reward_amount: 50,
    min_qualified_condition: 2,
    max_reward_cap: 10000,
    referral_earnings_enabled: true,
  },
  withdrawals: {
    withdrawals_enabled: true,
    min_withdrawal_amount: 500,
    max_withdrawal_amount: 50000,
    withdrawal_fee_pct: 0,
    jazzcash_enabled: true,
    easypaisa_enabled: true,
    bank_enabled: true,
    jazzcash_title: 'Earnzo Official Operations',
    jazzcash_number: '03001234567',
    easypaisa_title: 'Earnzo Payments',
    easypaisa_number: '03451234567',
    bank_iban: 'PK36MEZN0001234567890123',
    bank_name: 'Meezan Bank Limited',
  },
  welcomeMessage: {
    enabled: true,
    new_user_title: 'Welcome to Earnzo! 🎉',
    new_user_message: 'Hi {name}, start earning today by completing tasks and inviting friends!',
    returning_user_title: 'Welcome Back! 👋',
    returning_user_message: 'Hi {name}, great to see you again! Check out your new daily tasks.',
    display_duration_seconds: 6,
  },
  auth: {
    registration_enabled: true,
    email_otp_enabled: false,
    otp_cooldown_seconds: 60,
  },
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
  allSessions: VideoWatchSession[];
  completedVideoIdsToday: string[];
  startWatchSession: (videoId: string) => Promise<{ session: VideoWatchSession; error?: string }>;
  completeWatchSession: (sessionId: string, sessionToken: string) => Promise<{ success: boolean; rewardAmount?: number; error?: string }>;
  addVideo: (video: Omit<VideoTask, 'id' | 'created_at'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateVideo: (id: string, updates: Partial<VideoTask>) => Promise<{ success: boolean; error?: string }>;
  deleteVideo: (id: string) => Promise<{ success: boolean; error?: string }>;
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
  paymentClearings: PaymentClearing[];
  activeRevenue: number;
  totalClearedRevenue: number;
  clearRevenue: (amount: number, note?: string) => Promise<{ success: boolean; message?: string; error?: string; remaining?: number }>;
  allProfiles: Profile[];
  allMemberships: Membership[];
  allWallets: Record<string, WalletAccount>;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'banned') => void;
  updateUserRole: (userId: string, role: 'user' | 'support' | 'manager' | 'admin') => void;

  // Third-Party Ads
  adPlacements: AdPlacement[];
  addAdPlacement: (ad: Omit<AdPlacement, 'id' | 'impressions' | 'clicks'>) => void;
  updateAdPlacement: (id: string, updates: Partial<AdPlacement>) => void;
  deleteAdPlacement: (id: string) => void;
  recordAdClick: (id: string) => void;

  // Website Content Management
  websiteContent: WebsiteContentItem[];
  addWebsiteContent: (item: Omit<WebsiteContentItem, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateWebsiteContent: (id: string, updates: Partial<WebsiteContentItem>) => Promise<{ success: boolean; error?: string }>;
  deleteWebsiteContent: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleWebsiteContent: (id: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;

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
  refetchData: () => Promise<void>;
  isLoading: boolean;
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
  WEBSITE_CONTENT: 'watchearn_website_content_v1',
  PAYMENT_CLEARINGS: 'watchearn_payment_clearings_v1',
  COMPLETED_VIDEOS_TODAY: 'watchearn_completed_videos_today_v1',
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

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated: SystemSettings = {
        ...prev,
        ...newSettings,
        general: newSettings.general ? { ...prev.general, ...newSettings.general } : prev.general,
        referrals: newSettings.referrals ? { ...prev.referrals, ...newSettings.referrals } : prev.referrals,
        withdrawals: newSettings.withdrawals ? { ...prev.withdrawals, ...newSettings.withdrawals } : prev.withdrawals,
        welcomeMessage: newSettings.welcomeMessage ? { ...prev.welcomeMessage, ...newSettings.welcomeMessage } : prev.welcomeMessage,
        auth: newSettings.auth ? { ...prev.auth, ...newSettings.auth } : prev.auth,
      };

      // Keep legacy top-level mirror fields synced
      if (updated.general?.maintenance_mode !== undefined) {
        updated.maintenanceMode = updated.general.maintenance_mode;
      }
      if (updated.withdrawals?.min_withdrawal_amount !== undefined) {
        updated.minWithdrawalBalance = updated.withdrawals.min_withdrawal_amount;
      }
      if (updated.referrals?.min_qualified_condition !== undefined) {
        updated.requiredQualifiedReferrals = updated.referrals.min_qualified_condition;
      }
      if (updated.referrals?.reward_amount !== undefined && updated.referrals.reward_type === 'percentage') {
        updated.referralCommissionPct = updated.referrals.reward_amount;
      }
      if (updated.withdrawals?.jazzcash_title) updated.jazzcashTitle = updated.withdrawals.jazzcash_title;
      if (updated.withdrawals?.jazzcash_number) updated.jazzcashNumber = updated.withdrawals.jazzcash_number;
      if (updated.withdrawals?.easypaisa_title) updated.easypaisaTitle = updated.withdrawals.easypaisa_title;
      if (updated.withdrawals?.easypaisa_number) updated.easypaisaNumber = updated.withdrawals.easypaisa_number;
      if (updated.withdrawals?.bank_iban) updated.bankIban = updated.withdrawals.bank_iban;

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });

    if (isLiveSupabaseConfigured) {
      try {
        if (newSettings.general) {
          await supabase.from('settings').upsert({
            key: 'general_settings',
            value: newSettings.general,
            updated_at: new Date().toISOString(),
          });
        }
        if (newSettings.referrals) {
          await supabase.from('settings').upsert({
            key: 'referral_settings',
            value: newSettings.referrals,
            updated_at: new Date().toISOString(),
          });
        }
        if (newSettings.withdrawals) {
          await supabase.from('settings').upsert({
            key: 'withdrawal_settings',
            value: newSettings.withdrawals,
            updated_at: new Date().toISOString(),
          });
        }
        if (newSettings.welcomeMessage) {
          await supabase.from('settings').upsert({
            key: 'welcome_message_settings',
            value: newSettings.welcomeMessage,
            updated_at: new Date().toISOString(),
          });
        }
        if (newSettings.auth) {
          await supabase.from('settings').upsert({
            key: 'auth_settings',
            value: newSettings.auth,
            updated_at: new Date().toISOString(),
          });
        }

        // Keep business_rules synced for backward compatibility
        const br = {
          minWithdrawalBalance: newSettings.withdrawals?.min_withdrawal_amount ?? newSettings.minWithdrawalBalance ?? settings.minWithdrawalBalance,
          requiredQualifiedReferrals: newSettings.referrals?.min_qualified_condition ?? newSettings.requiredQualifiedReferrals ?? settings.requiredQualifiedReferrals,
          referralCommissionPct: newSettings.referrals?.reward_amount ?? newSettings.referralCommissionPct ?? settings.referralCommissionPct,
          maintenanceMode: newSettings.general?.maintenance_mode ?? newSettings.maintenanceMode ?? settings.maintenanceMode,
          jazzcashTitle: newSettings.withdrawals?.jazzcash_title ?? newSettings.jazzcashTitle ?? settings.jazzcashTitle,
          jazzcashNumber: newSettings.withdrawals?.jazzcash_number ?? newSettings.jazzcashNumber ?? settings.jazzcashNumber,
          easypaisaTitle: newSettings.withdrawals?.easypaisa_title ?? newSettings.easypaisaTitle ?? settings.easypaisaTitle,
          easypaisaNumber: newSettings.withdrawals?.easypaisa_number ?? newSettings.easypaisaNumber ?? settings.easypaisaNumber,
          bankIban: newSettings.withdrawals?.bank_iban ?? newSettings.bankIban ?? settings.bankIban,
        };
        await supabase.from('settings').upsert({
          key: 'business_rules',
          value: br,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed to upsert settings to Supabase:', e);
      }
    }
    logAuditEvent('settings_updated', 'settings', 'system', newSettings);
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

  // 2. Business Data State (Source of Truth: Supabase with clean default fallback)
  const [allMemberships, setAllMemberships] = useState<Membership[]>([]);
  const [allWallets, setAllWallets] = useState<Record<string, WalletAccount>>({});
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  const [allReferrals, setAllReferrals] = useState<Referral[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize from Supabase
  const fetchData = async () => {
    if (!isLiveSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch system settings from public.settings
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData && settingsData.length > 0) {
        const rowMap: Record<string, any> = {};
        settingsData.forEach((row: any) => {
          rowMap[row.key] = row.value;
        });

        const general = rowMap['general_settings'] || DEFAULT_SETTINGS.general;
        const referrals = rowMap['referral_settings'] || DEFAULT_SETTINGS.referrals;
        const withdrawals = rowMap['withdrawal_settings'] || DEFAULT_SETTINGS.withdrawals;
        const welcomeMessage = rowMap['welcome_message_settings'] || DEFAULT_SETTINGS.welcomeMessage;
        const auth = rowMap['auth_settings'] || DEFAULT_SETTINGS.auth;
        const businessRules = rowMap['business_rules'] || {};

        const mergedSettings: SystemSettings = {
          minWithdrawalBalance: Number(withdrawals?.min_withdrawal_amount ?? businessRules?.minWithdrawalBalance ?? DEFAULT_SETTINGS.minWithdrawalBalance),
          requiredQualifiedReferrals: Number(referrals?.min_qualified_condition ?? businessRules?.requiredQualifiedReferrals ?? DEFAULT_SETTINGS.requiredQualifiedReferrals),
          referralCommissionPct: Number(referrals?.reward_amount ?? businessRules?.referralCommissionPct ?? DEFAULT_SETTINGS.referralCommissionPct),
          maintenanceMode: Boolean(general?.maintenance_mode ?? businessRules?.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode),
          jazzcashTitle: withdrawals?.jazzcash_title ?? businessRules?.jazzcashTitle ?? DEFAULT_SETTINGS.jazzcashTitle,
          jazzcashNumber: withdrawals?.jazzcash_number ?? businessRules?.jazzcashNumber ?? DEFAULT_SETTINGS.jazzcashNumber,
          easypaisaTitle: withdrawals?.easypaisa_title ?? businessRules?.easypaisaTitle ?? DEFAULT_SETTINGS.easypaisaTitle,
          easypaisaNumber: withdrawals?.easypaisa_number ?? businessRules?.easypaisaNumber ?? DEFAULT_SETTINGS.easypaisaNumber,
          bankIban: withdrawals?.bank_iban ?? businessRules?.bankIban ?? DEFAULT_SETTINGS.bankIban,
          general,
          referrals,
          withdrawals,
          welcomeMessage,
          auth,
        };

        setSettings(mergedSettings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(mergedSettings));
      }

      // Fetch plans
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (plansData && plansData.length > 0) {
        setPlans(plansData as Plan[]);
      }

      // Fetch dynamic website content (Admins see all; normal visitors see enabled content)
      const contentQuery = isAdmin
        ? supabase.from('website_content').select('*').order('display_order', { ascending: true })
        : supabase.from('website_content').select('*').eq('enabled', true).order('display_order', { ascending: true });
      const { data: contentData } = await contentQuery;
      if (contentData) {
        setWebsiteContent(contentData as WebsiteContentItem[]);
      }

      // Fetch videos from single source of truth (public.videos)
      const videosQuery = isAdmin
        ? supabase.from('videos').select('*').order('created_at', { ascending: false })
        : supabase.from('videos').select('*').eq('status', 'active').order('created_at', { ascending: false });
      const { data: videosData, error: videosErr } = await videosQuery;
      if (!videosErr && videosData) {
        setVideos(videosData as VideoTask[]);
        localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videosData));
      }

      // If user is authenticated with a valid UUID, fetch their user-specific and admin data
      if (currentUserId && isValidUUID(currentUserId)) {
        // Memberships query
        const memQuery = isAdmin
          ? supabase.from('memberships').select('*, plan:plans(*)').order('created_at', { ascending: false })
          : supabase.from('memberships').select('*, plan:plans(*)').eq('user_id', currentUserId).order('created_at', { ascending: false });
        const { data: memData } = await memQuery;
        if (memData) {
          setAllMemberships(memData as Membership[]);
        }

        // Wallet query
        const walQuery = isAdmin
          ? supabase.from('wallet_accounts').select('*')
          : supabase.from('wallet_accounts').select('*').eq('user_id', currentUserId);
        const { data: walData } = await walQuery;
        if (walData) {
          const map: Record<string, WalletAccount> = {};
          walData.forEach((w: any) => {
            map[w.user_id] = w as WalletAccount;
          });
          setAllWallets(map);
        }

        // Transactions query
        const trxQuery = isAdmin
          ? supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false })
          : supabase.from('wallet_transactions').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false });
        const { data: trxData } = await trxQuery;
        if (trxData) {
          setAllTransactions(trxData as WalletTransaction[]);
        }

        // Watch Sessions query (Source of truth for task completion & anti-duplicate)
        const sesQuery = supabase
          .from('video_watch_sessions')
          .select('*')
          .eq('user_id', currentUserId)
          .order('started_at', { ascending: false })
          .limit(100);
        const { data: sesData } = await sesQuery;
        if (sesData) {
          setAllSessions(sesData as VideoWatchSession[]);
        }

        // Referrals query
        const refQuery = isAdmin
          ? supabase.from('referrals').select('*')
          : supabase.from('referrals').select('*').eq('referrer_id', currentUserId);
        const { data: refData } = await refQuery;
        if (refData) {
          setAllReferrals(refData as Referral[]);
        }

        // Payments query
        const payQuery = isAdmin
          ? supabase.from('payments').select('*').order('created_at', { ascending: false })
          : supabase.from('payments').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false });
        const { data: payData } = await payQuery;
        if (payData) {
          setAllPayments(payData as Payment[]);
        }

        // Withdrawals query
        const wthQuery = isAdmin
          ? supabase.from('withdrawals').select('*').order('created_at', { ascending: false })
          : supabase.from('withdrawals').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false });
        const { data: wthData } = await wthQuery;
        if (wthData) {
          setAllWithdrawals(wthData as Withdrawal[]);
        }

        // Profiles & Audit query (Admin view)
        if (isAdmin) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          if (profData && profData.length > 0) {
            setAllProfiles(profData as Profile[]);
          }

          const { data: auditData } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
          if (auditData && auditData.length > 0) {
            setAuditLogs(auditData as AuditLog[]);
          }

          const { data: clrData } = await supabase
            .from('payment_clearings')
            .select('*')
            .order('created_at', { ascending: false });
          if (clrData && clrData.length > 0) {
            setPaymentClearings(clrData as PaymentClearing[]);
          }
        }
      } else {
        // Logged out / guest state: clear sensitive data
        setAllMemberships([]);
        setAllWallets({});
        setAllTransactions([]);
        setAllReferrals([]);
        setAllPayments([]);
        setAllWithdrawals([]);
        setAllSessions([]);
      }
    } catch (err: any) {
      console.warn('Error fetching Supabase platform data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run fetchData whenever current user or admin role changes
  useEffect(() => {
    fetchData();
  }, [currentUserId, isAdmin]);

  // Realtime synchronization + Window Focus refetch
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !currentUserId || !isValidUUID(currentUserId)) return;

    // Refetch on window focus
    const onFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', onFocus);

    // Supabase Realtime Channel
    const channel = supabase.channel(`earnzo-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memberships' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_accounts' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_watch_sessions' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'website_content' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, isAdmin]);

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

  // Derive current user's wallet from Supabase data
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

  const transactions: WalletTransaction[] = useMemo(() => {
    if (isAdmin) return allTransactions;
    if (!currentUserId) return [];
    return allTransactions.filter((t) => t.user_id === currentUserId);
  }, [allTransactions, currentUserId, isAdmin]);

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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (isLiveSupabaseConfigured) {
            const validDbVideos = parsed.filter((v: any) => isValidUUID(v?.id));
            if (validDbVideos.length > 0) return validDbVideos;
          } else {
            return parsed;
          }
        }
      } catch (e) {
        // silent
      }
    }
    return isLiveSupabaseConfigured ? [] : INITIAL_VIDEOS;
  });

  const [allSessions, setAllSessions] = useState<VideoWatchSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSession, setActiveSession] = useState<VideoWatchSession | null>(null);

  // Payment Clearings State (Preserves all payments while resetting displayed revenue)
  const [paymentClearings, setPaymentClearings] = useState<PaymentClearing[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_CLEARINGS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_CLEARINGS, JSON.stringify(paymentClearings));
  }, [paymentClearings]);

  const totalRevenue = useMemo(() => {
    return allPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  }, [allPayments]);

  const totalClearedRevenue = useMemo(() => {
    return paymentClearings.reduce((s, c) => s + Number(c.amount_cleared), 0);
  }, [paymentClearings]);

  const activeRevenue = useMemo(() => {
    return Math.max(0, totalRevenue - totalClearedRevenue);
  }, [totalRevenue, totalClearedRevenue]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLocalStr = new Date().toLocaleDateString('en-CA');

  const [cachedCompletedToday, setCachedCompletedToday] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPLETED_VIDEOS_TODAY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr || parsed.date === todayLocalStr) {
          return Array.isArray(parsed.ids) ? parsed.ids : [];
        }
      }
    } catch {}
    return [];
  });

  const markVideoCompletedToday = (videoId: string) => {
    if (!videoId) return;
    setCachedCompletedToday((prev) => {
      const next = Array.from(new Set([...prev, videoId]));
      try {
        localStorage.setItem(
          STORAGE_KEYS.COMPLETED_VIDEOS_TODAY,
          JSON.stringify({ date: todayStr, ids: next })
        );
      } catch {}
      return next;
    });
  };

  const completedVideoIdsToday = useMemo(() => {
    if (!currentUserId) return [];
    const ids = new Set<string>(cachedCompletedToday);

    // 1. From allSessions
    allSessions.forEach((s) => {
      if (s.user_id === currentUserId && s.status === 'completed') {
        const d = s.completed_at || s.started_at;
        if (d && (d.startsWith(todayStr) || d.startsWith(todayLocalStr))) {
          ids.add(s.video_id);
        }
      }
    });

    // 2. From ledger transactions
    allTransactions.forEach((t) => {
      if (t.user_id === currentUserId && t.type === 'video_reward') {
        const d = t.created_at;
        if (d && (d.startsWith(todayStr) || d.startsWith(todayLocalStr))) {
          if (t.metadata && t.metadata.video_id) {
            ids.add(t.metadata.video_id);
          }
        }
      }
    });

    return Array.from(ids);
  }, [allSessions, allTransactions, cachedCompletedToday, currentUserId, todayStr, todayLocalStr]);

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

  // 10.5 Website Content Elements (Dynamic Page Builder)
  const [websiteContent, setWebsiteContent] = useState<WebsiteContentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEBSITE_CONTENT);
    return saved ? JSON.parse(saved) : [];
  });

  // 11. Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return saved ? JSON.parse(saved) : [];
  });

  // 12. Notifications & Audit Logs
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const notifications: NotificationItem[] = useMemo(() => {
    if (isAdmin) return allNotifications;
    if (!currentUserId) return [];
    return allNotifications.filter((n) => n.user_id === currentUserId || n.user_id === 'broadcast');
  }, [allNotifications, currentUserId, isAdmin]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'aud-001',
        actor_email: 'admin@earnzo.com',
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

  // Persist non-sensitive presentation items
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(adPlacements));
  }, [adPlacements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEBSITE_CONTENT, JSON.stringify(websiteContent));
  }, [websiteContent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifications));
  }, [allNotifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helpers
  const logAuditEvent = async (action: string, entity: string, entityId?: string, details?: Record<string, any>) => {
    const newEntry: AuditLog = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `aud-${Date.now()}`,
      actor_id: user?.id,
      actor_email: user?.email || 'admin@earnzo.com',
      action,
      entity,
      entity_id: entityId,
      details: details || {},
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from('audit_logs').insert([
          {
            actor_id: user?.id && isValidUUID(user.id) ? user.id : null,
            actor_email: user?.email || 'admin@earnzo.com',
            action,
            entity,
            entity_id: entityId || null,
            details: details || {},
            created_at: newEntry.created_at,
          },
        ]);
      } catch (err) {
        console.warn('Failed to insert audit log in Supabase:', err);
      }
    }
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type'], action_url?: string, targetUserId?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: targetUserId || currentUserId || 'system',
      title,
      message,
      type,
      is_read: false,
      action_url,
      created_at: new Date().toISOString(),
    };
    setAllNotifications((prev) => [newNotif, ...prev]);
  };

  // Plan actions
  const updatePlan = async (id: string, updated: Partial<Plan>) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = { ...p, ...updated, updated_at: new Date().toISOString() };
          return next;
        }
        return p;
      })
    );
    if (isLiveSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('plans').update({ ...updated, updated_at: new Date().toISOString() }).eq('id', id);
      } catch (err) {
        console.warn('Failed to update plan in Supabase:', err);
      }
    }
    logAuditEvent('plan_updated', 'plans', id, updated);
  };

  const addPlan = async (p: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => {
    const newPlan: Plan = {
      ...p,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `plan-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPlans((prev) => [...prev, newPlan]);
    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from('plans').insert([newPlan]);
      } catch (err) {
        console.warn('Failed to insert plan in Supabase:', err);
      }
    }
    logAuditEvent('plan_created', 'plans', newPlan.id, { name: p.name, price: p.price });
  };

  const deletePlan = async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (isLiveSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('plans').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete plan in Supabase:', err);
      }
    }
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

    if (user?.status === 'suspended' || user?.status === 'banned') {
      return { success: false, message: 'Your account has been suspended or terminated. Transactions are restricted.' };
    }

    const selectedPlan = plans.find((p) => p.id === data.planId) || plans[0];

    // Live Supabase integration
    if (isLiveSupabaseConfigured) {
      try {
        // ALWAYS retrieve verified Supabase auth session user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const effectiveUserId = authUser?.id || (isValidUUID(currentUserId) ? currentUserId : null);

        if (!effectiveUserId || !isValidUUID(effectiveUserId)) {
          return {
            success: false,
            message: 'Authentication required. Please log in with your verified account to complete this plan purchase.',
          };
        }

        const { data: insertedPayment, error } = await supabase
          .from('payments')
          .insert({
            user_id: effectiveUserId,
            plan_id: selectedPlan.id,
            amount: data.amount,
            method: data.method,
            transaction_ref: data.transactionRef,
            sender_account_title: data.senderAccountTitle,
            sender_account_number: data.senderAccountNumber,
            proof_image_url: data.proofImageUrl || null,
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase submitPayment error:', error);
          return { success: false, message: error.message || 'Failed to submit payment to database.' };
        }

        // Refresh live data from Supabase
        await fetchData();

        addNotification(
          'Payment Submitted',
          `Your Rs. ${data.amount} payment for ${selectedPlan.name} via ${data.method} (TRX: ${data.transactionRef}) has been submitted for review.`,
          'payment'
        );

        return {
          success: true,
          paymentId: insertedPayment.id,
          message: 'Payment submitted successfully! Admin will verify and activate your plan.',
        };
      } catch (err: any) {
        console.error('Supabase submitPayment error:', err);
        return { success: false, message: err.message || 'Failed to submit payment to database.' };
      }
    }

    // Local Sandbox Fallback
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
    // 1. Live Supabase RPC execution
    if (isLiveSupabaseConfigured) {
      try {
        const { data: rpcRes, error } = await supabase.rpc('rpc_verify_payment', {
          p_payment_id: paymentId,
          p_action: 'approve',
          p_notes: 'Verified via Earnzo Admin Panel',
        });

        if (error) {
          console.error('Supabase rpc_verify_payment error:', error);
          return { success: false, message: error.message || 'Database error during payment verification.' };
        }

        // Refresh all Supabase business state (memberships, wallets, transactions, referrals, payments)
        await fetchData();

        logAuditEvent('payment_approved', 'payments', paymentId, {
          action: 'approve',
          result: rpcRes,
        });

        return { success: true, message: 'Payment successfully approved and membership activated via Supabase!' };
      } catch (err: any) {
        console.warn('Supabase approvePayment exception, falling back:', err.message);
      }
    }

    // 2. Local sandbox fallback (with idempotency guard)
    const payment = allPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment record not found' };
    if (payment.status !== 'pending') {
      return { success: false, message: `Payment is already processed with status: ${payment.status}` };
    }

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
      '/earn',
      payment.user_id
    );

    logAuditEvent('payment_approved', 'payments', paymentId, {
      amount: payment.amount,
      user_id: payment.user_id,
      plan: selectedPlan.name,
    });
    return { success: true, message: `Payment verified and ${selectedPlan.name} activated!` };
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('rpc_verify_payment', {
          p_payment_id: paymentId,
          p_action: 'reject',
          p_notes: reason || 'Transaction reference could not be verified.',
        });

        if (error) {
          console.error('Supabase reject error:', error);
          return { success: false, message: error.message };
        }

        await fetchData();
        return { success: true, message: 'Payment marked as rejected in Supabase.' };
      } catch (err: any) {
        console.warn('Supabase reject payment exception, falling back:', err.message);
      }
    }

    setAllPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: 'failed', admin_notes: reason, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          : p
      )
    );

    const paymentToReject = allPayments.find(p => p.id === paymentId);
    addNotification(
      'Payment Verification Failed',
      `Payment was rejected: ${reason}. Please check your transaction reference.`,
      'payment',
      undefined,
      paymentToReject?.user_id
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

    if (user?.status === 'suspended' || user?.status === 'banned') {
      return {
        session: {} as any,
        error: 'Your account has been suspended or terminated. Access to tasks is restricted.',
      };
    }

    if (!activePlan) {
      return {
        session: {} as any,
        error: '🔒 Earning Locked. Choose an active plan to unlock your available reward tasks.',
      };
    }

    // 1. Live Supabase RPC execution
    if (isLiveSupabaseConfigured && isValidUUID(videoId)) {
      try {
        const { data, error } = await supabase.rpc('rpc_start_watch_session', {
          p_video_id: videoId,
        });

        if (error) {
          return { session: {} as any, error: error.message };
        }

        if (data) {
          const newSession: VideoWatchSession = {
            id: data.session_id,
            user_id: currentUserId,
            video_id: videoId,
            session_token: data.session_token,
            started_at: new Date().toISOString(),
            watch_duration_seconds: 0,
            status: 'active',
            is_fraud_flagged: false,
            reward_credited: false,
          };

          setAllSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
          setActiveSession(newSession);
          return { session: newSession };
        }
      } catch (err: any) {
        console.warn('Supabase start watch session exception, falling back:', err);
        return { session: {} as any, error: err.message || 'Failed to start watch session' };
      }
    }

    // 2. Offline Sandbox Fallback
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

    if (user?.status === 'suspended' || user?.status === 'banned') {
      return { success: false, error: 'Your account has been suspended or terminated. Access is restricted.' };
    }

    // 1. Live Supabase RPC execution
    if (isLiveSupabaseConfigured && isValidUUID(sessionId)) {
      try {
        const { data, error } = await supabase.rpc('rpc_complete_watch_session', {
          p_session_id: sessionId,
          p_session_token: sessionToken,
        });

        if (error) {
          console.error('Supabase complete watch session error:', error);
          return { success: false, error: error.message };
        }

        // Refresh all business state from Supabase (wallets, memberships, transactions, sessions)
        const targetSession = allSessions.find((s) => s.id === sessionId);
        if (targetSession?.video_id) {
          markVideoCompletedToday(targetSession.video_id);
        }
        await fetchData();
        setActiveSession(null);

        return {
          success: true,
          rewardAmount: Number(data?.reward_amount) || activePlan?.reward_per_task || 0,
        };
      } catch (err: any) {
        console.warn('Supabase complete watch session exception, falling back:', err);
        return { success: false, error: err.message || 'Reward validation failed' };
      }
    }

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
  const addVideo = async (
    v: Omit<VideoTask, 'id' | 'created_at'>
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    const videoId = crypto.randomUUID();
    const cleanCampaignId = v.campaign_id && isValidUUID(v.campaign_id) ? v.campaign_id : null;

    const newVideo: VideoTask = {
      ...v,
      id: videoId,
      campaign_id: cleanCampaignId || undefined,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('videos')
          .insert({
            id: videoId,
            campaign_id: cleanCampaignId,
            title: v.title,
            description: v.description,
            video_url: v.video_url,
            thumbnail_url: v.thumbnail_url,
            duration_seconds: v.duration_seconds,
            reward_amount: v.reward_amount,
            daily_limit: v.daily_limit,
            per_user_limit: v.per_user_limit,
            status: v.status,
            category: v.category,
            sponsor_badge: v.sponsor_badge,
          })
          .select()
          .single();

        if (error) {
          // Attempt atomic RPC fallback
          const { data: rpcData, error: rpcErr } = await supabase.rpc('rpc_admin_add_video', {
            p_id: videoId,
            p_campaign_id: cleanCampaignId,
            p_title: v.title,
            p_description: v.description,
            p_video_url: v.video_url,
            p_thumbnail_url: v.thumbnail_url,
            p_duration_seconds: v.duration_seconds,
            p_reward_amount: v.reward_amount,
            p_daily_limit: v.daily_limit,
            p_per_user_limit: v.per_user_limit,
            p_status: v.status,
            p_category: v.category,
            p_sponsor_badge: v.sponsor_badge,
          });

          if (rpcErr) {
            console.error('Supabase addVideo error:', error.message, rpcErr.message);
            return { success: false, error: rpcErr.message || error.message };
          }
        }

        setVideos((prev) => [newVideo, ...prev.filter((item) => item.id !== videoId)]);
        logAuditEvent('video_created', 'videos', videoId, { title: v.title });
        await fetchData();
        return { success: true, id: videoId };
      } catch (err: any) {
        console.error('Supabase addVideo exception:', err);
        return { success: false, error: err.message || 'Failed to save sponsored video to database' };
      }
    }

    setVideos((prev) => [newVideo, ...prev]);
    logAuditEvent('video_created', 'videos', newVideo.id, { title: v.title });
    return { success: true, id: newVideo.id };
  };

  const updateVideo = async (
    id: string,
    updates: Partial<VideoTask>
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanCampaignId =
      updates.campaign_id !== undefined
        ? updates.campaign_id && isValidUUID(updates.campaign_id)
          ? updates.campaign_id
          : null
        : undefined;

    const dbPayload: any = { ...updates };
    if ('campaign_id' in updates) {
      dbPayload.campaign_id = cleanCampaignId;
    }
    dbPayload.updated_at = new Date().toISOString();

    if (isLiveSupabaseConfigured && isValidUUID(id)) {
      try {
        const { error } = await supabase
          .from('videos')
          .update(dbPayload)
          .eq('id', id);

        if (error) {
          // Attempt atomic RPC fallback
          const { error: rpcErr } = await supabase.rpc('rpc_admin_update_video', {
            p_id: id,
            p_campaign_id: cleanCampaignId !== undefined ? cleanCampaignId : null,
            p_title: updates.title || null,
            p_description: updates.description || null,
            p_video_url: updates.video_url || null,
            p_thumbnail_url: updates.thumbnail_url || null,
            p_duration_seconds: updates.duration_seconds || null,
            p_reward_amount: updates.reward_amount || null,
            p_daily_limit: updates.daily_limit || null,
            p_per_user_limit: updates.per_user_limit || null,
            p_status: updates.status || null,
            p_category: updates.category || null,
            p_sponsor_badge: updates.sponsor_badge || null,
          });

          if (rpcErr) {
            console.error('Supabase updateVideo error:', error.message, rpcErr.message);
            return { success: false, error: rpcErr.message || error.message };
          }
        }

        setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
        logAuditEvent('video_updated', 'videos', id, updates);
        await fetchData();
        return { success: true };
      } catch (err: any) {
        console.error('Supabase updateVideo exception:', err);
        return { success: false, error: err.message || 'Failed to update video in database' };
      }
    }

    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    logAuditEvent('video_updated', 'videos', id, updates);
    return { success: true };
  };

  const deleteVideo = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isLiveSupabaseConfigured && isValidUUID(id)) {
      try {
        const { error } = await supabase.from('videos').delete().eq('id', id);
        if (error) {
          // Attempt atomic RPC fallback
          const { error: rpcErr } = await supabase.rpc('rpc_admin_delete_video', { p_id: id });
          if (rpcErr) {
            console.error('Supabase deleteVideo error:', error.message, rpcErr.message);
            return { success: false, error: rpcErr.message || error.message };
          }
        }
        setVideos((prev) => prev.filter((v) => v.id !== id));
        logAuditEvent('video_deleted', 'videos', id);
        await fetchData();
        return { success: true };
      } catch (err: any) {
        console.error('Supabase deleteVideo exception:', err);
        return { success: false, error: err.message || 'Failed to delete video from database' };
      }
    }

    setVideos((prev) => prev.filter((v) => v.id !== id));
    logAuditEvent('video_deleted', 'videos', id);
    return { success: true };
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

    if (user?.status === 'suspended' || user?.status === 'banned') {
      return { success: false, message: 'Your account has been suspended or terminated. Withdrawals are disabled.' };
    }

    if (!withdrawalEligibility.isEligible) {
      return {
        success: false,
        message: `Withdrawal requirement not met: ${withdrawalEligibility.missingRequirements.join('. ')}`,
      };
    }

    if (isLiveSupabaseConfigured) {
      try {
        const { data: resData, error } = await supabase.rpc('rpc_request_withdrawal', {
          p_amount: data.amount,
          p_method: data.method,
          p_account_title: data.accountTitle,
          p_account_number: data.accountNumber,
          p_bank_name: data.bankName || null,
        });

        if (error) {
          console.error('Supabase rpc_request_withdrawal error:', error);
          return { success: false, message: error.message };
        }

        await fetchData();
        return {
          success: true,
          message: `Withdrawal of Rs. ${data.amount} requested. Net Rs. ${resData?.net_amount || (data.amount * 0.975)} will be dispatched after administrative audit.`,
        };
      } catch (err: any) {
        console.warn('Supabase requestWithdrawal exception, falling back:', err.message);
      }
    }

    // Local sandbox fallback
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
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('rpc_process_withdrawal', {
          p_withdrawal_id: withdrawalId,
          p_action: action,
          p_transaction_ref: transactionRef || null,
          p_rejection_reason: rejectionReason || null,
        });

        if (error) {
          console.error('Supabase rpc_process_withdrawal error:', error);
          return { success: false, message: error.message };
        }

        await fetchData();
        return {
          success: true,
          message: action === 'approve'
            ? 'Withdrawal approved and disbursed in Supabase!'
            : 'Withdrawal rejected and funds refunded to user in Supabase.',
        };
      } catch (err: any) {
        console.warn('Supabase processWithdrawal exception, falling back:', err.message);
      }
    }

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
  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    if (userId === currentUserId || userId === 'admin-001') {
      alert('Security violation: Administrators cannot suspend or terminate their own active account.');
      return;
    }
    const target = allProfiles.find((p) => p.id === userId);
    if (target?.email?.toLowerCase() === 'admin@earnzo.com') {
      alert('Security violation: The master root administrator account cannot be suspended or terminated.');
      return;
    }
    setAllProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, status, updated_at: new Date().toISOString() } : p))
    );
    if (isLiveSupabaseConfigured && isValidUUID(userId)) {
      try {
        await supabase.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', userId);
      } catch (e) {
        console.warn('Failed to update profile status in Supabase:', e);
      }
    }
    logAuditEvent('user_status_changed', 'profiles', userId, { status, target_email: target?.email });
  };

  const updateUserRole = async (userId: string, role: 'user' | 'support' | 'manager' | 'admin') => {
    setAllProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, role, updated_at: new Date().toISOString() } : p))
    );
    if (isLiveSupabaseConfigured && isValidUUID(userId)) {
      try {
        await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId);
      } catch (e) {
        console.warn('Failed to update profile role in Supabase:', e);
      }
    }
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

  // Website Content Management (CMS)
  const addWebsiteContent = async (item: Omit<WebsiteContentItem, 'id' | 'created_at' | 'updated_at'>) => {
    const generateId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const newItem: WebsiteContentItem = {
      ...item,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setWebsiteContent((prev) => [...prev, newItem].sort((a, b) => a.display_order - b.display_order));
    logAuditEvent('content_created', 'website_content', newItem.id, { title: item.title, type: item.type, placement: item.placement });

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('website_content').insert([newItem]).select().single();
        if (error) {
          console.warn('Supabase website_content insert error:', error.message);
        } else if (data) {
          setWebsiteContent((prev) => prev.map((c) => (c.id === newItem.id ? (data as WebsiteContentItem) : c)));
          return { success: true, id: data.id };
        }
      } catch (err: any) {
        console.warn('Supabase website_content insert exception:', err);
      }
    }
    return { success: true, id: newItem.id };
  };

  const updateWebsiteContent = async (id: string, updates: Partial<WebsiteContentItem>) => {
    const updatedWithTimestamp = { ...updates, updated_at: new Date().toISOString() };
    setWebsiteContent((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedWithTimestamp } : c)).sort((a, b) => a.display_order - b.display_order)
    );
    logAuditEvent('content_updated', 'website_content', id, updates);

    if (isLiveSupabaseConfigured && isValidUUID(id)) {
      try {
        const { error } = await supabase.from('website_content').update(updatedWithTimestamp).eq('id', id);
        if (error) {
          console.warn('Supabase website_content update error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase website_content update exception:', err);
        return { success: false, error: err.message || 'Update failed' };
      }
    }
    return { success: true };
  };

  const deleteWebsiteContent = async (id: string) => {
    setWebsiteContent((prev) => prev.filter((c) => c.id !== id));
    logAuditEvent('content_deleted', 'website_content', id);

    if (isLiveSupabaseConfigured && isValidUUID(id)) {
      try {
        const { error } = await supabase.from('website_content').delete().eq('id', id);
        if (error) {
          console.warn('Supabase website_content delete error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase website_content delete exception:', err);
        return { success: false, error: err.message || 'Delete failed' };
      }
    }
    return { success: true };
  };

  const toggleWebsiteContent = async (id: string, enabled: boolean) => {
    return updateWebsiteContent(id, { enabled });
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
    setAllNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
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

  const clearRevenue = async (
    amount: number,
    notes?: string
  ): Promise<{ success: boolean; message: string; remaining?: number }> => {
    if (amount <= 0) {
      return { success: false, message: 'Clearing amount must be greater than zero.' };
    }
    if (amount > activeRevenue) {
      return { success: false, message: `Clearing amount (Rs. ${amount}) exceeds current active revenue (Rs. ${activeRevenue}).` };
    }

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('rpc_admin_clear_revenue', {
          p_amount: amount,
          p_notes: notes || null,
        });

        if (!error && data) {
          await fetchData();
          return {
            success: true,
            message: `Rs. ${amount} successfully cleared. Reference ID: ${data.reference_id}`,
            remaining: data.remaining_total,
          };
        }
      } catch (err: any) {
        console.warn('Supabase clearRevenue exception, using fallback:', err);
      }
    }

    // Local / fallback clearing record
    const refId = `CLR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const paidPayments = allPayments.filter((p) => p.status === 'paid');
    const uniqueUsers = new Set(paidPayments.map((p) => p.user_id)).size;

    const breakdown: Record<string, number> = {};
    paidPayments.forEach((p) => {
      breakdown[p.method] = (breakdown[p.method] || 0) + p.amount;
    });

    const newRecord: PaymentClearing = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `clr-${Date.now()}`,
      reference_id: refId,
      amount_cleared: amount,
      total_before: activeRevenue,
      remaining_total: Math.max(0, activeRevenue - amount),
      admin_id: user?.id,
      admin_email: user?.email || 'admin@earnzo.com',
      contributing_payments_count: paidPayments.length,
      contributing_users_count: uniqueUsers,
      breakdown,
      notes,
      created_at: new Date().toISOString(),
    };

    setPaymentClearings((prev) => [newRecord, ...prev]);
    logAuditEvent('revenue_cleared', 'payment_clearings', newRecord.id, {
      reference_id: refId,
      amount_cleared: amount,
      remaining_total: newRecord.remaining_total,
      notes,
    });

    return {
      success: true,
      message: `Rs. ${amount} successfully cleared. Reference ID: ${refId}`,
      remaining: newRecord.remaining_total,
    };
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
        allSessions,
        completedVideoIdsToday,
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
        allMemberships,
        allWallets,
        updateUserStatus,
        updateUserRole,
        adPlacements,
        addAdPlacement,
        updateAdPlacement,
        deleteAdPlacement,
        recordAdClick,
        websiteContent,
        addWebsiteContent,
        updateWebsiteContent,
        deleteWebsiteContent,
        toggleWebsiteContent,
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
        refetchData: fetchData,
        isLoading,
        paymentClearings,
        clearRevenue,
        activeRevenue,
        totalClearedRevenue,
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
