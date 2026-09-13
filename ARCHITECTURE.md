# WATCH EARN — SYSTEM ARCHITECTURE SPECIFICATION
**Platform**: WATCH EARN  
**Tagline**: *Watch Videos • Earn Rewards • Grow Together*  
**Standard**: Production-Grade Ledger & Reward Video Verification  

---

## 1. Executive Summary & Business Compliance

WatchEarn is a legitimate, compliant, reward-based sponsored video platform. Advertisers fund campaigns to gain authentic user engagement for their promotional video content. Verified registered members who purchase an operational membership (configurable at Rs. 300 / 30-day validity) are allotted verified daily video tasks. Upon authentic completion of these tasks, rewards funded by the campaign budget are credited directly into a double-entry ledger wallet. Members can request payouts via localized payment rails (JazzCash, Easypaisa, Bank Transfer) subject to administrative verification and audit.

### Core Non-Negotiable Business Rules:
1. **NOT an investment platform**: No promises of guaranteed returns, daily interest, capital growth, or fixed yields.
2. **Transparent Platform Fees & Rewards**: The membership fee covers platform identity verification, infrastructure, anti-abuse screening, and access to the sponsored task pipeline. Rewards are strictly derived from campaign advertising allocations.
3. **Strict Ad Policy Compliance**: Third-party advertisements (e.g. banners, external network units) are isolated from reward tasks. No forced ad clicks, artificial traffic generation, auto-refreshing iframes, or automated click-incentivization are permitted.
4. **Zero Client-Side Trust**: Client applications have zero authority to increment balances, self-issue rewards, or alter payment states. Every financial event is governed by database-level transactions, cryptographic watch sessions, and server-side validation.

---

## 2. High-Level System Architecture

```
                                    +-----------------------+
                                    |    CLIENT BROWSERS    |
                                    | (Desktop/Tablet/Phone)|
                                    +-----------+-----------+
                                                |
                                      HTTPS / TLS 1.3 / REST
                                                |
                                    +-----------v-----------+
                                    |   VITE + REACT APP    |
                                    |  - Tailwind CSS       |
                                    |  - Lucide Icons       |
                                    |  - Recharts Analytics |
                                    +-----------+-----------+
                                                |
                              Supabase JS Client / PostgreSQL API
                                                |
              +---------------------------------+---------------------------------+
              |                                 |                                 |
    +---------v----------+            +---------v----------+            +---------v----------+
    |   AUTHENTICATION   |            |  ANTI-CHEAT ENGINE |            |   DOUBLE-ENTRY     |
    |  - Supabase Auth   |            |  - Watch Sessions  |            |   WALLET LEDGER    |
    |  - JWT Bearer      |            |  - Duration Timing |            |  - Immutable Logs  |
    |  - RBAC Middleware |            |  - Heartbeat Check |            |  - Atomic Trx      |
    +--------------------+            +--------------------+            +--------------------+
              |                                 |                                 |
              +---------------------------------+---------------------------------+
                                                |
                                    +-----------v-----------+
                                    |  POSTGRESQL DATABASE  |
                                    |  - RLS Enforcement    |
                                    |  - Stored Procedures  |
                                    |  - Triggers & Locks   |
                                    +-----------------------+
```

---

## 3. Frontend Architecture

### 3.1 Tech Stack
- **Framework**: React 18+ with TypeScript (Strict Mode)
- **Tooling**: Vite for fast bundling, HMR, and optimized production treeshaking
- **Styling**: Tailwind CSS with custom design tokens:
  - Backgrounds: Neutral clean whites (`#ffffff`) and crisp off-whites (`#f8fafc`, `#f1f5f9`)
  - Typography: Slate / Navy high-contrast text (`#0f172a`, `#334155`)
  - Primary Accent: Deep Indigo / Violet (`#4f46e5`, `#6366f1`)
  - Success Indicator: Emerald (`#10b981`)
  - Risk / Error: Crimson (`#ef4444`)
  - Warning: Amber (`#f59e0b`)
- **Icons**: Lucide React
- **Visualizations**: Recharts for administrative and user earning metrics
- **Routing**: React Router v6 with declarative Route Guards

### 3.2 Modular Directory Structure
```
src/
├── assets/          # Static brand graphics and logos
├── components/      # Reusable UI primitives
│   ├── ui/          # Buttons, Cards, Badges, Modals, Progress, Tables, Inputs
│   ├── layout/      # Navbar, Footer, UserSidebar, AdminSidebar, TopBar
│   ├── ads/         # Clearly marked display ad units (non-incentivized)
│   └── video/       # Secure Video Player with telemetry
├── context/         # React context stores
│   ├── AuthContext.tsx      # User session, login, register, RBAC state
│   ├── PlatformContext.tsx  # Global state, live config, mock/real bridge
│   └── NotificationContext.tsx
├── hooks/           # Custom reusable hooks (useWatchTimer, useWallet, useDebounce)
├── lib/             # Supabase client instantiation, mock data store, utilities
├── pages/           # View controllers
│   ├── public/      # Landing, How It Works, Plans, FAQ, Legal, Auth
│   ├── dashboard/   # User workspace (Overview, Videos, Wallet, Withdraw, etc.)
│   └── admin/       # Admin suite (Metrics, Users, Payouts, Content, Audit)
├── types/           # TypeScript database and business model interfaces
├── App.tsx          # Root routes and providers
└── main.tsx         # Entry point
```

---

## 4. Backend & Database Architecture

### 4.1 Database Engine
- **Platform**: Supabase / PostgreSQL 15+
- **Security**: Strict Row Level Security (RLS) enabled on all tables
- **Concurrency Control**: `SELECT ... FOR UPDATE` row-locking on wallet account rows to prevent race conditions during withdrawal and credit operations.

### 4.2 Entity Relationship Model
```
[profiles]
   ├── [memberships] ──> [plans]
   ├── [payments]
   ├── [wallet_accounts]
   │       └── [wallet_transactions]
   ├── [withdrawals]
   ├── [video_watch_sessions] ──> [videos] ──> [video_campaigns]
   ├── [referrals]
   └── [support_tickets]
```

### 4.3 Key Tables Definition
1. `profiles`: User demographic data, role (`user`, `support`, `manager`, `admin`), referral code, status (`active`, `suspended`, `banned`).
2. `plans`: 3 VIP Configurable tiers:
   - **Plan 1**: Rs. 300 buy-in | 7 daily tasks | Rs. 8/task | Max Rs. 56/day | 30 days | CTA: "Buy Plan 1"
   - **Plan 2 (POPULAR)**: Rs. 500 buy-in | 12 daily tasks | Rs. 10/task | Max Rs. 120/day | 30 days | CTA: "Buy Plan 2"
   - **Plan 3 (VIP)**: Rs. 950 buy-in | 17 daily tasks | Rs. 12/task | Max Rs. 204/day | 30 days | CTA: "Buy Plan 3"
3. `memberships`: User active plan validity window (`started_at`, `expires_at`, `status`, `plan_id`).
4. `payments`: Payment audit trail (`amount`, `method`, `status`, `transaction_ref`, `proof_url`, `plan_id`).
5. `video_campaigns`: Sponsor allocation (`budget`, `reward_per_completion`, `max_completions`, `spent`).
6. `videos`: Sponsored video metadata, required watch duration (e.g. 60s), dynamic reward payout based on user's active plan, daily completion limits.
7. `video_watch_sessions`: Server-generated session tokens, tracking playback progress, completion timestamps, and fraud status.
8. `wallet_accounts`: Current `balance`, `pending_balance` (locked during withdrawal), `total_earned`, `total_withdrawn`.
9. `wallet_transactions`: Immutable double-entry ledger records with precise transaction types and reference foreign keys.
10. `withdrawals`: Withdrawal requests, payout channel details (JazzCash, Easypaisa, Bank Transfer), administrative review statuses.
    - **Minimum Withdrawal Threshold**: Rs. 500.00
    - **Referral Qualification Rule**: Minimum 2 active qualified referrals (referred users who registered and purchased a verified membership plan).
11. `referrals` & `referral_rewards`: Direct 1-tier referral attribution:
    - **Commission Rate**: 10% direct platform referral reward credited upon verified plan purchase (e.g. Rs. 30 for Plan 1, Rs. 50 for Plan 2, Rs. 95 for Plan 3).
12. `advertisements`: Display banner inventory separated from video tasks.
13. `audit_logs`: Detailed compliance trail of every administrative mutation.

---

## 5. Authentication & Earning Access Flow

- **Engine**: Supabase Auth (OAuth 2.0 / JWT)
- **Token Handling**: Short-lived Access Tokens (1 hour) stored in memory / secure httpOnly cookies, auto-refreshed via Supabase Client SDK.
- **RBAC (Role-Based Access Control)**:
  - `user`: Access personal dashboard, watch assigned videos (if active plan purchased), view personal wallet, request withdrawals, open tickets.
  - `support`: View tickets, inspect user watch logs, reply to support requests.
  - `manager`: Manage video catalog, monitor campaigns, inspect payments.
  - `admin`: Full unrestricted authorization, financial ledger adjustments, plan alterations, payout approvals, audit log inspection.
- **Earning State Access Control**:
  - **No Active Plan**: Task earning is strictly **LOCKED**. Users see a clean informational locked card: *"🔒 Earning Locked. Choose an active plan to unlock your available reward tasks. [ View Plans ]"*. No task rewards or completion buttons are displayed.
  - **Active Plan**: Users see their active tier badge, daily task progress (`X / Y`), daily earnings, and only the allowed number of tasks at their tier's reward rate (Plan 1: Rs. 8, Plan 2: Rs. 10, Plan 3: Rs. 12).
- **Route Guards**:
  - `PublicRoute`: Allows guests, redirects authenticated users to `/dashboard`.
  - `ProtectedRoute`: Requires valid JWT session; enforces email verification and active account status.
  - `AdminRoute`: Verifies `profile.role === 'admin' || 'manager'`; denies access with 403 Forbidden otherwise.

---

## 6. Payment & Membership Architecture

### 6.1 Membership Workflow
1. User chooses from the 3 VIP plans on `/plans`:
   - Plan 1: Rs. 300
   - Plan 2: Rs. 500
   - Plan 3: Rs. 950
2. Checkout modal presents verified platform payment destination rails (JazzCash Account, Easypaisa Account, or Official Bank Account IBAN) with one-click copy buttons.
3. User transfers funds and submits Transaction ID (TRX / Reference Number) + payment channel.
4. Payment record created with status `pending`.
5. Admin verifies funds against banking statement and marks payment `paid`.
6. Database trigger/workflow activates `membership` for 30 days for the selected plan tier, initializes daily task limits, and credits a 10% direct commission to the qualified referrer.

---

## 7. Wallet & Double-Entry Ledger Architecture

### 7.1 Principles
- **No Direct Mutation**: No API endpoint or client code may perform `UPDATE wallet_accounts SET balance = balance + 10`.
- **Atomic Operations**: Balances are updated solely via database stored procedures:
  - `record_wallet_credit(user_id, amount, trx_type, ref_id, description)`
  - `lock_withdrawal_funds(user_id, amount, withdrawal_id)`
  - `finalize_withdrawal(withdrawal_id, success, admin_ref)`
- **Formula Integrity**:
  $$\text{Current Balance} = \sum(\text{Credits}) - \sum(\text{Debits}) - \text{Pending Locked}$$

---

## 8. Reward & Video Verification Architecture (Anti-Fraud)

```
[User Browser]                      [Anti-Cheat Server / RPC]            [Database Ledger]
      |                                         |                                |
      | 1. Request Watch (video_id)             |                                |
      |---------------------------------------->|                                |
      |                                         | 2. Check limits & active plan  |
      |                                         | 3. Create watch_session token  |
      | 4. Return session_id & secure token     |<-------------------------------|
      |<----------------------------------------|                                |
      |                                         |                                |
      | 5. Playback starts                      |                                |
      |    (Telemetric heartbeats every 10s)    |                                |
      |---------------------------------------->| 6. Validate continuous elapsed |
      |                                         |                                |
      | 7. Watch Complete (duration >= required)|                                |
      |    Submit completion with token         |                                |
      |---------------------------------------->| 8. Atomic Verification:        |
      |                                         |    - session token matches     |
      |                                         |    - actual elapsed >= req    |
      |                                         |    - not already completed     |
      |                                         |    - user daily limit not met  |
      |                                         |    - campaign budget available |
      |                                         | 9. Mark session completed      |
      |                                         |------------------------------->|
      |                                         | 10. Execute wallet ledger trx  |
      |                                         |------------------------------->|
      | 11. Return Success + Updated Balance    |<-------------------------------|
      |<----------------------------------------|
```

---

## 9. Security & Compliance Architecture

1. **SQL Injection Defense**: Strict parameterization via Supabase PostgREST and PL/pgSQL routines.
2. **XSS Protection**: React virtual DOM auto-escaping, sanitization of rich-text support tickets.
3. **CSRF Mitigation**: SameSite cookie policies and bearer JWT authorization.
4. **Rate Limiting**: Throttling watch session creations and withdrawal submissions.
5. **Anti-Bot Telemetry**: Detect rapid tab switching, headless browsers, or spoofed playback speed adjustments.
6. **Audit Trails**: Every administrative payout approval, user status modification, and system setting change creates an immutable entry in `audit_logs`.

---

## 10. Testing & Quality Assurance Strategy

1. **Static Analysis**: Strict TypeScript (`tsc --noEmit`) with zero `any` tolerance in core financial/ledger modules.
2. **Automated Unit & Integration Tests**:
   - Authentication lifecycle
   - Watch session verification and anti-replay guards
   - Ledger balance reconciliation
   - Withdrawal lock & refund transactions
3. **Manual Cross-Platform Verification**:
   - Desktop Chrome/Firefox/Edge (1920x1080)
   - Tablet iPad view (768x1024)
   - Mobile iPhone/Android view (375x812)
4. **Security Audit**: Automated and manual vulnerability scans for exposed keys or insecure RPC functions.
