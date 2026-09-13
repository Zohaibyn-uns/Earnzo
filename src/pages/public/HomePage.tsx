import React from 'react';
import { Link } from 'react-router-dom';
import {
  PlayCircle,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DisplayAdUnit } from '../../components/ads/DisplayAdUnit';

export const HomePage: React.FC = () => {
  const { plan, videos } = usePlatform();

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12">
        {/* Subtle decorative background aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/60 via-purple-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Watch Videos • Earn Rewards • Grow Together</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Watch Sponsored Videos.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Earn Platform Rewards.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The authentic sponsored video platform. Advertisers showcase high-definition products, and verified members complete authenticated viewing sessions to receive direct wallet rewards.
          </p>

          {/* Compliance Assurance Box */}
          <div className="mt-6 max-w-xl mx-auto p-3 bg-white/80 border border-emerald-200/90 rounded-2xl shadow-subtle flex items-center justify-center gap-2 text-xs text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Strict Anti-Fraud • Non-Investment Platform • Verified Payout Rails</span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full shadow-lg shadow-indigo-200" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full">
                Member Sign In
              </Button>
            </Link>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-left">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">Rs. {plan.price}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">30-Day Access Membership</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-left">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{plan.daily_task_limit}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Daily Verified Tasks</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-left">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">Rs. {plan.reward_per_task}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Avg Reward / Task</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle text-left">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">Rs. {plan.min_withdrawal}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Low Minimum Payout</div>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Incentivized Third Party Ad Placement */}
      <div className="max-w-4xl mx-auto px-4">
        <DisplayAdUnit placement="homepage" />
      </div>

      {/* 2. How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="primary" size="md" className="mb-3">
            Transparent Workflow
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How Earnzo Operates
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            A sustainable, closed-loop advertising ecosystem built on verified engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative group hover:border-indigo-300">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Register & Verify</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create your verified profile with standard phone and email verification to eliminate bot spam.
              </p>
            </CardContent>
          </Card>

          <Card className="relative group hover:border-indigo-300">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Activate Plan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Purchase the standard Rs. 300 membership (30-day validity) via JazzCash, Easypaisa, or direct Bank Transfer.
              </p>
            </CardContent>
          </Card>

          <Card className="relative group hover:border-indigo-300">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Watch Sponsored Videos</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Watch certified promotional videos for their full duration with server-side duration heartbeat checks.
              </p>
            </CardContent>
          </Card>

          <Card className="relative group hover:border-indigo-300">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900">Receive & Withdraw</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Earn rewards directly into your ledger wallet. Request withdrawals from Rs. 150 straight to JazzCash or Easypaisa.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Membership Showcase */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              Transparent Membership Tiers
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              Earnzo VIP Plans
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Fair-access VIP tiers designed for verified members. Choose your plan to unlock daily sponsored task pools.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow">
              Official Tier
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white">Rs. {plan.price}</span>
              <span className="text-slate-400 text-sm">/ 30 Days Access</span>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Provides member infrastructure verification, anti-cheat allocation, and unlocks sponsored brand tasks.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Up to {plan.daily_task_limit} verified video tasks daily</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Earn Rs. {plan.reward_per_task} on authentic task completion</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Minimum withdrawal threshold starting at just Rs. {plan.min_withdrawal}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant double-entry auditable ledger wallet</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Optional 1-tier referral earnings upon verified member signup</span>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/register">
                <Button size="lg" variant="primary" className="w-full bg-indigo-500 hover:bg-indigo-600">
                  Join for Rs. {plan.price}
                </Button>
              </Link>
            </div>

            <p className="text-[10px] text-slate-500 text-center mt-3">
              * Membership activates only upon manual or automated payment statement confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Watch & Earn Sample Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="primary" size="md" className="mb-2">
              Brand Video Pipeline
            </Badge>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sample Sponsored Tasks
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Active campaigns from accredited technology, education, and consumer brands.
            </p>
          </div>
          <Link to="/plans">
            <Button variant="outline" size="sm">
              View All Plan Benefits
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.slice(0, 3).map((video) => (
            <Card key={video.id} className="group flex flex-col justify-between">
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{video.duration_seconds}s required</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                  Rs. {video.reward_amount.toFixed(2)}
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                    {video.category} • {video.sponsor_badge}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {video.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Server verified</span>
                  <Link to="/dashboard/videos">
                    <span className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                      Watch Task <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. Wallet & Withdrawals Security Highlight */}
      <section className="bg-gradient-to-br from-indigo-50/70 to-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="primary" size="md">
                Ledger Accounting Integrity
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Enterprise Double-Entry Wallet With Localized Payouts
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every rupee earned is permanently recorded on an immutable database ledger. Our anti-cheat engine validates true playback before crediting rewards, protecting campaign sponsors and honest members alike.
              </p>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Zero Client-Side Balance Manipulation</strong>
                    <span className="text-slate-500 text-xs">Balances are calculated strictly server-side through cryptographic session tokens.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Local Payment Channels</strong>
                    <span className="text-slate-500 text-xs">Direct support for JazzCash, Easypaisa, and Raast / Interbank IBAN fund transfers.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Funds Lock Protection</strong>
                    <span className="text-slate-500 text-xs">Withdrawal requests atomically lock funds to pending state, preventing double-spend attempts.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/register">
                  <Button variant="primary">Create Verified Account</Button>
                </Link>
              </div>
            </div>

            {/* Visual Mock Ledger Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase">Wallet Ledger Sample</span>
                    <h4 className="text-base font-bold text-slate-900">Verified Member Balance</h4>
                  </div>
                </div>
                <Badge variant="success" size="sm">Audited</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Available Payout</span>
                  <div className="text-xl font-black text-slate-900 mt-1">Rs. 180.00</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Pending Approvals</span>
                  <div className="text-xl font-black text-amber-600 mt-1">Rs. 0.00</div>
                </div>
              </div>

              {/* Sample transactions */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent Ledger Activity</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">Task Reward (Smart Living 2026)</div>
                    <div className="text-[10px] text-slate-400">Server verified watch completion</div>
                  </div>
                  <span className="font-bold text-emerald-600">+Rs. 10.00</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">Member Welcome Bonus</div>
                    <div className="text-[10px] text-slate-400">Account setup incentive</div>
                  </div>
                  <span className="font-bold text-emerald-600">+Rs. 50.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="neutral" size="md" className="mb-2">
            Clear Transparency
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h4 className="text-sm font-bold text-slate-900">Is Earnzo an investment or cryptocurrency platform?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Absolutely NOT. Earnzo is an authentic advertising and market-research engagement platform. Membership fees cover identity verification, anti-cheat validation, and sponsored task access for 30 days. No fixed or guaranteed returns are promised.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h4 className="text-sm font-bold text-slate-900">How are video rewards funded?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Corporate advertisers and brand sponsors establish marketing budgets to receive real human engagement. When a member watches the full promotional video, a portion of the campaign’s ad spend is disbursed directly into the member’s wallet.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h4 className="text-sm font-bold text-slate-900">What is the minimum withdrawal amount and payout rail?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                You can request a withdrawal once your available balance reaches Rs. {plan.min_withdrawal}. Payouts are made directly to JazzCash, Easypaisa, or any local Pakistani commercial bank account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h4 className="text-sm font-bold text-slate-900">Can I use bots or automated scripts to skip video playback?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                No. Our server-side telemetry tracks playback duration and heartbeat intervals. Early completion attempts or automated scripts trigger fraud flags, fail cryptographic validation, and result in immediate account termination.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to Experience Legitimate Sponsored Video Rewards?
          </h2>
          <p className="text-indigo-100 text-sm max-w-xl mx-auto mt-3 leading-relaxed">
            Join verified members today. Register, activate your 30-day membership for Rs. 300, and access daily verified promotional tasks.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-slate-100 font-bold shadow-lg">
                Create Account Now
              </Button>
            </Link>
            <Link to="/plans">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Inspect Membership Details
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
