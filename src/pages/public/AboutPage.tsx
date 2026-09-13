import React from 'react';
import { ShieldCheck, Target, Users, Award } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary" size="md">
          About Earnzo
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Pioneering Authentic Digital Video Engagement
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Earnzo was founded on a simple principle: advertisers deserve real human attention, and viewers deserve direct, transparent compensation for their time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To eliminate digital advertising waste by creating a verified, fraud-free bridge between forward-thinking brand campaigns and attentive viewers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Integrity First</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We uphold strict compliance with national advertising ethics. No fake bots, no misleading get-rich-quick claims, and total double-entry ledger transparency.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Community Empowerment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Providing everyday digital citizens with accessible micro-earning opportunities through convenient localized payment infrastructure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
