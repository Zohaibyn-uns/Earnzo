import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PlayCircle, User, Mail, Phone, Lock, Tag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { AlertBanner } from '../../components/ui/AlertBanner';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
    acceptTerms: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the Terms of Service & Anti-Fraud rules to proceed.');
      return;
    }

    setLoading(true);
    const res = await register({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      referralCode: formData.referralCode,
    });
    setLoading(false);

    if (res.success) {
      navigate('/dashboard/membership');
    } else {
      setError(res.error || 'Registration could not be completed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <PlayCircle className="w-6 h-6 fill-white/20 stroke-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Watch<span className="text-indigo-600">Earn</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Create Verified Member Profile</h2>
          <p className="text-xs text-slate-500">Join the authentic sponsored video engagement platform</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-5">
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Legal Name"
                required
                placeholder="e.g. Tariq Mehmood"
                leftElement={<User className="w-4 h-4" />}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="name@example.com"
                  leftElement={<Mail className="w-4 h-4" />}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <Input
                  label="Mobile Phone (JazzCash/Easypaisa)"
                  type="tel"
                  required
                  placeholder="03001234567"
                  leftElement={<Phone className="w-4 h-4" />}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  leftElement={<Lock className="w-4 h-4" />}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  placeholder="Re-enter password"
                  leftElement={<Lock className="w-4 h-4" />}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>

              <Input
                label="Referral Code (Optional)"
                placeholder="e.g. ALI789"
                leftElement={<Tag className="w-4 h-4" />}
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                helperText="Enter your friend's code to link mutual community bonuses"
              />

              {/* Compliance & Terms Agreement */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  />
                  <span>
                    I accept the{' '}
                    <Link to="/terms" target="_blank" className="font-semibold text-indigo-600 hover:underline">
                      Terms of Service
                    </Link>
                    , acknowledge that WatchEarn is a reward-based advertising hub (NOT an investment scheme), and certify I will not use automated viewing bots.
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
