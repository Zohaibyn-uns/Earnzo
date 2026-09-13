import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { User, Mail, Phone, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ full_name: fullName, phone });
    setMsg('Profile details successfully updated.');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Profile & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal verification credentials and payout contact info.
        </p>
      </div>

      {msg && <AlertBanner type="success" message={msg} onClose={() => setMsg(null)} />}

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user?.full_name}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success" size="sm">
                  Verified Identity
                </Badge>
                <Badge variant="neutral" size="sm">
                  Ref Code: {user?.referral_code}
                </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftElement={<User className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              disabled
              value={user?.email || ''}
              leftElement={<Mail className="w-4 h-4" />}
              helperText="Email cannot be changed to maintain audit identity"
            />

            <Input
              label="Registered Mobile Phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftElement={<Phone className="w-4 h-4" />}
              helperText="Used for JazzCash & Easypaisa disbursement cross-validation"
            />

            <Button type="submit" variant="primary" size="md">
              Save Profile Details
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
