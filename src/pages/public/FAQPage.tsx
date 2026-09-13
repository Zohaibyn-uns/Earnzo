import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const FAQPage: React.FC = () => {
  const { plan } = usePlatform();

  const faqs = [
    {
      q: 'What is WatchEarn and how does it work?',
      a: 'WatchEarn is a reward-based sponsored video network. Commercial brands sponsor video campaigns to reach real consumers. Verified members watch these promotional videos to earn defined platform rewards credited directly into their auditable ledger wallet.',
    },
    {
      q: 'Why is there a Rs. 300 membership fee?',
      a: 'The Rs. 300 fee grants 30-day verified access. It filters out bot networks, covers phone/email verification costs, maintains high-availability server telemetry, and provides access to sponsored advertising budgets.',
    },
    {
      q: 'Are returns or earnings guaranteed?',
      a: 'NO. WatchEarn is strictly NOT an investment platform. We do not promise fixed daily returns or capital dividends. Rewards are only issued when a member actively and authentically completes valid video tasks.',
    },
    {
      q: 'How and when can I withdraw my earnings?',
      a: `You can submit a withdrawal once your balance reaches the minimum threshold of Rs. ${plan.min_withdrawal}. Supported payout rails include JazzCash, Easypaisa, and Pakistani Bank Transfers. Requests are typically processed within 24 hours.`,
    },
    {
      q: 'Can I speed up videos or watch them in the background?',
      a: 'No. Our video player incorporates cryptographic heartbeat telemetry and visibility sensors. If you minimize the window, mute playback, or try to fast-forward before the required duration, the watch session will fail verification and no reward will be issued.',
    },
    {
      q: 'What is the referral program policy?',
      a: 'Members can share their referral link with friends. When a referred friend registers and activates a verified membership, a one-time referral incentive is credited. WatchEarn is strictly a 1-tier referral program, NOT a multi-level marketing (MLM) or pyramid recruitment scheme.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <Badge variant="primary" size="md">
          Help Center & FAQs
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-slate-600">
          Everything you need to understand WatchEarn's business model, compliance rules, and payment rails.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <Card key={i} className="hover:border-indigo-200 transition-colors">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-slate-900 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 pl-8 leading-relaxed">
                {faq.a}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
