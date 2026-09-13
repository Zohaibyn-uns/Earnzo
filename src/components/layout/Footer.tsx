import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <PlayCircle className="w-5 h-5 fill-white/20 stroke-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Earn<span className="text-indigo-400">zo</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm text-xs sm:text-sm">
              Watch Videos • Earn Rewards • Grow Together.
              A legitimate reward-based sponsored video network connecting authentic brand video campaigns with verified members.
            </p>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Legitimate Business Model</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Earnzo is NOT an investment scheme. We offer zero guaranteed passive returns. Rewards are strictly funded by verified advertiser marketing budgets.
              </p>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/plans" className="hover:text-white transition-colors">VIP Membership Plans</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
              <li><Link to="/dashboard/videos" className="hover:text-white transition-colors">Sponsored Tasks</Link></li>
              <li><Link to="/dashboard/wallet" className="hover:text-white transition-colors">Ledger Wallet</Link></li>
            </ul>
          </div>

          {/* Col 3: Compliance & Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">Legal & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund & Cancellation Policy</Link></li>
              <li><Link to="/terms#anti-fraud" className="hover:text-white transition-colors">Anti-Fraud Rules</Link></li>
              <li><Link to="/terms#ad-compliance" className="hover:text-white transition-colors">Advertising Standards</Link></li>
            </ul>
          </div>

          {/* Col 4: Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">Support Rails</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>support@earnzo.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>+92 300 1234567 (Mon-Sat)</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Lahore / Islamabad, Pakistan</span>
              </li>
            </ul>
            <div className="pt-2">
              <span className="text-[11px] text-slate-500">Supported Payout Rails:</span>
              <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-300">
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">JazzCash</span>
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Easypaisa</span>
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Bank Transfer</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Earnzo Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Server Time: UTC+05:00 (PKT)</span>
            <span>Ledger Integrity Engine: Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
