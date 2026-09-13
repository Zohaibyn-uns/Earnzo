# WATCH EARN
**Watch Videos • Earn Rewards • Grow Together**

WatchEarn is a production-ready, security-first sponsored video and platform reward system. It connects verified digital audiences with sponsored video advertising campaigns funded by real commercial partners, enforcing strict double-entry ledger bookkeeping, anti-cheat duration validation, and localized payout disbursements (JazzCash, Easypaisa, Bank Transfer).

---

## 🚀 Key Highlights & Business Integrity

- **NOT an Investment Scheme**: No fixed daily profit promises, no speculative interest, and zero capital returns.
- **3 VIP Configurable Membership Plans**:
  - **Plan 1**: Rs. 300 buy-in | 7 daily tasks | Rs. 8/task | Max Rs. 56/day | CTA: "Buy Plan 1"
  - **Plan 2 (POPULAR)**: Rs. 500 buy-in | 12 daily tasks | Rs. 10/task | Max Rs. 120/day | CTA: "Buy Plan 2"
  - **Plan 3 (VIP)**: Rs. 950 buy-in | 17 daily tasks | Rs. 12/task | Max Rs. 204/day | CTA: "Buy Plan 3"
- **Strict Locked Earning Gate**: Earning is locked for users without an active plan (`🔒 Earning Locked. Choose an active plan to unlock your available reward tasks.`). No rewards are shown or distributed before membership activation.
- **Withdrawal Gating Rules**: Minimum balance of Rs. 500 AND at least 2 active qualified referrals (referred members with verified plan purchase) required to submit a withdrawal.
- **Direct 10% 1-Tier Referral Model**: 10% direct platform referral reward credited upon verified plan purchase without pyramid MLM schemes.
- **Strict Server-Side Validation**: Browser code has zero authority to mutate wallet balances. All rewards require cryptographic watch session duration verification.
- **Separated Third-Party Advertisements**: Internal display ad inventory (banners) is strictly isolated from video tasks to prevent forced clicks, artificial impressions, or advertising network policy violations.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript (Strict Mode), Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend & Database**: PostgreSQL 15+, Supabase (Auth, Storage, PostgREST, Row Level Security - RLS).
- **Ledger Architecture**: Double-entry ledger accounting where balance equals immutable sum of credits minus debits and locked funds.
- **Payout Rails**: Native Pakistani rails including JazzCash, Easypaisa, and 1Link IBAN Bank Transfers.

---

## 📁 Project Architecture

```
├── ARCHITECTURE.md              # Complete end-to-end system architecture document
├── IMPLEMENTATION_PLAN.md       # Phased milestone execution record
├── QA_REPORT.md                 # Full Quality Assurance test & audit report
├── verify_system.cjs            # Automated core integration & security test script
├── supabase/
│   ├── migrations/
│   │   ├── 20260912000001_initial_schema.sql      # Database schema (17 tables)
│   │   └── 20260912000002_rls_and_functions.sql   # RLS policies & stored procedures
│   └── seed.sql                                   # Default Rs. 300 plan, sample campaigns & ads
├── src/
│   ├── assets/                  # Brand assets
│   ├── components/
│   │   ├── ui/                  # Button, Badge, Card, Modal, Input, AlertBanner
│   │   ├── layout/              # Navbar, Footer, DashboardLayout, AdminLayout
│   │   └── ads/                 # DisplayAdUnit (clearly marked non-incentivized)
│   ├── context/
│   │   ├── AuthContext.tsx      # Auth, RBAC, session persistence, role switching
│   │   └── PlatformContext.tsx  # Ledger state, anti-cheat engine, local sandbox
│   ├── lib/
│   │   ├── supabase.ts          # Supabase SDK client & live detection
│   │   ├── mockData.ts          # Seed data & campaigns
│   │   └── utils.ts             # Currency (PKR) and date formatters
│   ├── pages/
│   │   ├── public/              # Home, How It Works, Plans, FAQ, About, Contact, Legal
│   │   ├── auth/                # Login, Register
│   │   ├── dashboard/           # Member portal (Watch & Earn, Wallet, Withdraw, Plan)
│   │   └── admin/               # Admin suite (Dashboard, Users, Plans, Payouts, Content)
│   ├── types/
│   │   └── database.ts          # Complete domain TypeScript definitions
│   ├── App.tsx                  # Declarative route guards & layout structure
│   └── main.tsx                 # Entry point
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- Node.js v18+ (tested on v24.19.0)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_PLATFORM_NAME=WatchEarn
VITE_PLATFORM_TAGLINE="Watch Videos • Earn Rewards • Grow Together"
VITE_MEMBERSHIP_PRICE=300
VITE_MIN_WITHDRAWAL=150
```
*(Note: If live cloud keys are omitted, the application automatically engages the local sandbox state store with full persistence and realistic simulation).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Automated Verification Test
```bash
node verify_system.cjs
```

### 6. Production Bundle Build
```bash
npm run build
```

---

## 🔑 Default Credentials & Role Switcher

For instant testing, use the **Quick Demo Switch** bar at the top of the app or sign in with:
- **Member Account**: `user@watchearn.com` / `UserPass123!`
- **Administrator Account**: `admin@watchearn.com` / `AdminPass123!`

---

## 🛡 Row Level Security & Anti-Cheat Engine

1. **Watch Sessions**: Initialized via `rpc_start_watch_session(video_id)` which issues a cryptographically secure token.
2. **Elapsed Playback**: On completion, `rpc_complete_watch_session(session_id, token)` verifies server-side timestamps. Attempts to claim rewards prematurely fail immediately and are recorded in `video_watch_sessions.is_fraud_flagged`.
3. **Withdrawal Locking**: Calling `rpc_request_withdrawal` atomically moves funds from `balance` to `pending_balance`, preventing duplicate requests.
4. **Disbursement Approval/Rejection**: Admins approve payouts (marked as paid with external bank reference) or reject them (triggering an automatic 100% wallet refund).
