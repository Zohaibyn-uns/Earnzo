import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Tv,
  Coins,
  ArrowRight,
  AlertTriangle,
  Lock,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePlatform } from '../../context/PlatformContext';

export const HowItWorksPage: React.FC = () => {
  const { plan } = usePlatform();

  const steps = [
    {
      num: '01',
      title: 'Member Identity Verification & Signup',
      desc: 'Create an account with your real name, valid mobile number, and email. Every member is verified to eliminate automated bot traffic and preserve sponsor value.',
      badge: 'Account Setup',
    },
    {
      num: '02',
      title: 'Rs. 300 Operational Membership Activation',
      desc: `The configurable Rs. ${plan.price} membership covers 30 days of verified infrastructure access, daily task queue allocations, anti-cheat validation overhead, and secure wallet custody.`,
      badge: 'Transparent Access',
    },
    {
      num: '03',
      title: 'Complete Authentic Video Watch Tasks',
      desc: 'Access up to 10 verified brand campaigns per day. Videos must be watched for their required duration (e.g. 30–60 seconds). Playback telemetry checks ensure authentic view count attribution.',
      badge: 'Verified Engagement',
    },
    {
      num: '04',
      title: 'Automatic Double-Entry Ledger Rewards',
      desc: `Once a watch session passes cryptographic duration validation, Rs. ${plan.reward_per_task} per video is atomically credited into your balance. Every credit creates an immutable ledger entry.`,
      badge: 'Instant Rewards',
    },
    {
      num: '05',
      title: 'Direct Localized Payout Dispatches',
      desc: `When your ledger balance reaches Rs. ${plan.min_withdrawal}, request a withdrawal directly to JazzCash, Easypaisa, or bank account. Funds are atomically locked and verified before dispatch.`,
      badge: 'Guaranteed Payouts',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary" size="md">
          Platform Architecture & Workflow
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How WatchEarn Works
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          WatchEarn bridges corporate advertisers seeking authentic brand exposure with verified digital audiences through strict cryptographic watch sessions.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {steps.map((s, idx) => (
          <Card key={s.num} className="hover:border-indigo-200 transition-all">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-indigo-100">
                {s.num}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {s.badge}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Warning */}
      <div className="max-w-4xl mx-auto p-6 bg-amber-50/80 border border-amber-200 rounded-3xl space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Strict Advertising & Anti-Fraud Compliance Notice</span>
        </div>
        <p className="text-xs text-amber-900/80 leading-relaxed">
          WatchEarn maintains zero tolerance for artificial traffic, click hijacking, auto-refreshing tabs, or proxy emulation. Any attempt to tamper with session duration tokens or spoof playback will immediately forfeit accumulated balances and trigger an irreversible device ban.
        </p>
      </div>

      {/* Ready CTA */}
      <div className="text-center">
        <Link to="/register">
          <Button size="lg" variant="primary">
            Register for WatchEarn Today
          </Button>
        </Link>
      </div>
    </div>
  );
};
