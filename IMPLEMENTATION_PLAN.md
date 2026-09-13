# WATCH EARN — IMPLEMENTATION PLAN & PHASED MILESTONES

## Phased Milestones

### Milestone 1: Project Scaffolding & Design System Foundations
- Initialize Vite + React + TypeScript in `h:/My Softwer/Online Earning`.
- Configure Tailwind CSS, PostCSS, Lucide icons, and modern design tokens.
- Implement reusable UI primitives (Buttons, Cards, Badges, Modals, Progress bars, Tables, Form fields, Tabs).
- Establish layout wrappers for Public, User Dashboard, and Admin Command Center.

### Milestone 2: Database Schema, SQL Migrations & Stored Procedures
- Create PostgreSQL schemas and migrations:
  - `profiles`, `plans`, `memberships`, `payments`
  - `video_campaigns`, `videos`, `video_watch_sessions`
  - `wallet_accounts`, `wallet_transactions`, `withdrawals`
  - `referrals`, `referral_rewards`, `advertisements`, `ad_placements`
  - `announcements`, `support_tickets`, `notifications`, `audit_logs`, `settings`
- Implement Row Level Security (RLS) policies for user isolation and admin RBAC.
- Implement atomic stored procedures:
  - `start_watch_session`
  - `complete_watch_session` (with duration check, anti-abuse, daily limit check)
  - `request_withdrawal` (with atomic pending lock)
  - `process_withdrawal` (approve/reject with refund)
  - `activate_membership`

### Milestone 3: Client Data Layer, Auth Context & Simulated Provider
- Implement Supabase client wrapper (`src/lib/supabase.ts`).
- Build comprehensive local mock/simulation engine to allow seamless zero-config offline execution and automated test runs.
- Implement `AuthContext` with login, register, password reset, session persistence, and referral tracking.
- Implement `PlatformContext` for reactive synchronization of wallet, watch sessions, payments, and admin actions.

### Milestone 4: Public Marketing & Informational Website
- Build responsive, fintech-styled public pages:
  - `/` (Home with Hero, How It Works, Plan Showcase, Watch & Earn Demo, Trust & Safety Disclaimers, FAQ)
  - `/how-it-works` (Transparent 4-step guide)
  - `/plans` (Configurable Rs. 300 membership details, withdrawal limits)
  - `/faq` (Sustainability, advertising model, payout instructions)
  - `/about` & `/contact` (Platform mission and support form)
  - `/terms`, `/privacy`, `/refund-policy` (Legal disclaimers: no guaranteed profit, anti-fraud terms)
  - `/login`, `/register`, `/forgot-password`

### Milestone 5: Member Dashboard & Watch & Earn Feature
- Build User Dashboard (`/dashboard`):
  - Available Balance, Today's Earnings, Total Earned, Membership Status, Progress Bar.
- Build Watch & Earn (`/dashboard/videos` & `/dashboard/videos/:id`):
  - Catalog of sponsored videos with thumbnails, reward tags, and completion badges.
  - Secure video player requiring verified continuous playback, heartbeat telemetry, and server validation.
- Build Wallet & Transactions (`/dashboard/wallet`, `/dashboard/transactions`).
- Build Withdraw Portal (`/dashboard/withdraw`):
  - Local rails: JazzCash, Easypaisa, Bank Transfer.
  - Real-time fee and net amount calculation, balance lock.
- Build Membership Management (`/dashboard/membership`).
- Build Referral System (`/dashboard/referrals`) & Support Tickets (`/dashboard/support`).

### Milestone 6: Admin Command Center
- Build Admin Dashboard (`/admin`):
  - Metrics: Total Users, Active Members, Revenue, Total Rewards Paid, Pending Withdrawals, Active Videos.
  - Analytics visual charts.
- Build Admin Management Modules:
  - `/admin/users`: User list, status, role management.
  - `/admin/plans`: Configurable Rs. 300 plan parameters.
  - `/admin/payments`: Review pending membership payments, inspect TRX references/proofs, approve/reject.
  - `/admin/videos` & `/admin/campaigns`: Manage video catalog, daily limits, campaign budgets.
  - `/admin/withdrawals`: Payout approval/rejection with automated balance deduction or refund.
  - `/admin/advertisements`: Internal display ad inventory (separate from reward videos).
  - `/admin/audit-logs`: Immutable log of administrative actions.
  - `/admin/settings`: Platform configurations.

### Milestone 7: Verification, Testing & Documentation
- Implement automated test suite (Auth, Watch Session, Ledger, Withdrawal Lock, Admin RBAC).
- Execute TypeScript check and production build.
- Perform cross-device verification (Desktop, Tablet, Mobile).
- Generate `QA_REPORT.md` and `README.md`.
