import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, FileText, Lock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const LegalPages: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Terms of Service';
  let badge = 'Legal Agreement';

  if (path === '/privacy') {
    title = 'Privacy & Data Protection Policy';
    badge = 'User Privacy';
  } else if (path === '/refund-policy') {
    title = 'Membership Refund & Cancellation Policy';
    badge = 'Consumer Protection';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <Badge variant="primary" size="md">
          {badge}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-slate-500">Last Revised & Effective: September 2026</p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-10 space-y-6 text-sm text-slate-700 leading-relaxed">
          {path === '/terms' && (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong>NON-INVESTMENT REGULATORY DECLARATION:</strong> Earnzo is strictly a reward-based sponsored video marketing platform. We do not provide financial investment advisory services, capital asset trading, or guaranteed returns on any purchases. Membership fees cover access and identity verification, NOT a financial deposit.
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h3>
                <p>
                  By creating an account on Earnzo, you affirm that you are at least 18 years old and agree to abide by all platform rules, security protocols, and operational terms.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">2. Advertising & Anti-Fraud Compliance</h3>
                <p>
                  Earnzo adheres strictly to international advertising network guidelines:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Users shall not generate artificial impressions or automated video plays via bots, crawlers, or emulation scripts.</li>
                  <li>No auto-clicking, hidden iframes, or proxy masking is permitted on the platform.</li>
                  <li>Reward videos are distinct from display ad placements. Third-party ad clicks are strictly voluntary and non-incentivized.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">3. Membership & Reward Distribution</h3>
                <p>
                  Membership plans confer 30-day access to daily task allocations. Rewards are funded exclusively by verified campaign sponsors and are contingent upon authentic completion of video watch sessions.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">4. Withdrawal Regulations</h3>
                <p>
                  Withdrawal requests are processed upon reaching the minimum threshold of Rs. 500 and having at least 2 qualified referrals who purchased an eligible plan. All requests are subject to audit logs, session verification, and identity cross-checks. Suspicious accounts may be suspended pending administrative review.
                </p>
              </section>
            </>
          )}

          {path === '/privacy' && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
                <p>
                  To prevent multi-accounting and bot fraud, Earnzo collects:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Full legal name, email address, and mobile phone number.</li>
                  <li>Banking / mobile wallet details provided specifically for withdrawal disbursements (JazzCash / Easypaisa / Bank IBAN).</li>
                  <li>Device telemetry, browser user-agent, and IP address for session anti-cheat validation.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">2. How Your Data Is Protected</h3>
                <p>
                  All database tables are governed by PostgreSQL Row Level Security (RLS). Passwords are cryptographically salted and hashed. We never sell or lease user credentials to third parties.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">3. Telemetry & Heartbeat Monitoring</h3>
                <p>
                  During video playback, our player transmits continuous timing heartbeats to confirm real human viewing. This telemetry is kept solely for fraud audit verification.
                </p>
              </section>
            </>
          )}

          {path === '/refund-policy' && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">1. Membership Fee Refund Terms</h3>
                <p>
                  Membership fees cover immediate setup costs, identity screening, and server allocation.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>If your payment was submitted but your account was rejected or cannot be activated due to system error, a 100% refund is processed within 48 hours.</li>
                  <li>Once an account has activated its membership and completed even one sponsored video task, the membership fee is non-refundable.</li>
                  <li>Accounts terminated for fraud, botting, or terms violations forfeit all fees and balances.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">2. Requesting a Refund</h3>
                <p>
                  To request a refund for an unactivated membership, open a support ticket or email support@earnzo.com with your Transaction ID (TRX) and registered mobile number.
                </p>
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
