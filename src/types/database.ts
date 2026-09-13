export type UserRole = 'user' | 'support' | 'manager' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  referral_code: string;
  referred_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  price: number;
  duration_days: number;
  daily_task_limit: number;
  reward_per_task: number;
  daily_reward_limit: number;
  min_withdrawal: number;
  max_withdrawal: number;
  withdrawal_fee_pct: number;
  is_active: boolean;
  display_order?: number;
  cta_text?: string;
  created_at: string;
  updated_at: string;
}

export type MembershipStatus = 'active' | 'expired' | 'cancelled';

export interface Membership {
  id: string;
  user_id: string;
  plan_id: string;
  status: MembershipStatus;
  started_at: string;
  expires_at: string;
  tasks_completed_today: number;
  last_task_date: string;
  plan?: Plan;
}

export type PaymentMethod = 'JazzCash' | 'Easypaisa' | 'Bank Transfer' | 'Internal Wallet';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  method: PaymentMethod;
  transaction_ref?: string;
  proof_image_url?: string;
  sender_account_title?: string;
  sender_account_number?: string;
  status: PaymentStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
  plan?: Plan;
}

export interface VideoCampaign {
  id: string;
  name: string;
  sponsor_name: string;
  description: string;
  total_budget: number;
  spent_budget: number;
  reward_per_completion: number;
  max_completions: number;
  current_completions: number;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'expired';
  start_date: string;
  end_date?: string;
}

export interface VideoTask {
  id: string;
  campaign_id?: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  reward_amount: number;
  daily_limit: number;
  per_user_limit: number;
  status: 'active' | 'paused' | 'archived';
  category: string;
  sponsor_badge: string;
  created_at: string;
  completed_by_user?: boolean;
}

export interface VideoWatchSession {
  id: string;
  user_id: string;
  video_id: string;
  session_token: string;
  started_at: string;
  completed_at?: string;
  watch_duration_seconds: number;
  status: 'active' | 'completed' | 'abandoned' | 'flagged';
  is_fraud_flagged: boolean;
  fraud_reason?: string;
  reward_credited: boolean;
}

export interface WalletAccount {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  updated_at: string;
}

export type TransactionType =
  | 'membership_purchase'
  | 'video_reward'
  | 'withdrawal_request'
  | 'withdrawal_completed'
  | 'withdrawal_rejected'
  | 'referral_reward'
  | 'bonus'
  | 'refund'
  | 'admin_adjustment';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'approved' | 'paid' | 'rejected' | 'cancelled';
export type WithdrawalMethod = 'JazzCash' | 'Easypaisa' | 'Bank Transfer';

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  method: WithdrawalMethod;
  account_title: string;
  account_number: string;
  bank_name?: string;
  status: WithdrawalStatus;
  transaction_reference?: string;
  rejection_reason?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  user?: Profile;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  membership_purchased: boolean;
  reward_issued: boolean;
  commission_rate?: number;
  commission_amount?: number;
  is_qualified?: boolean;
  status?: 'registered' | 'qualified' | 'pending';
  plan_name?: string;
  created_at: string;
  referred_user?: Profile;
}

export interface AdPlacement {
  id: string;
  title: string;
  placement: 'homepage' | 'dashboard' | 'sidebar' | 'content' | 'footer';
  image_url: string;
  target_url: string;
  sponsor_name: string;
  impressions: number;
  clicks: number;
  is_active: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'payout' | 'maintenance' | 'promotion';
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: 'Payment' | 'Withdrawal' | 'Video Tasks' | 'Account' | 'Other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user?: Profile;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'payment' | 'reward' | 'membership' | 'withdrawal' | 'announcement' | 'security';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SystemSettings {
  minWithdrawalBalance: number;
  requiredQualifiedReferrals: number;
  referralCommissionPct: number;
  jazzcashTitle: string;
  jazzcashNumber: string;
  easypaisaTitle: string;
  easypaisaNumber: string;
  bankIban: string;
}
