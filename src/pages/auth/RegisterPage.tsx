import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PlayCircle, User, Mail, Phone, Lock, Tag, ArrowRight, ShieldCheck, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { AlertBanner } from '../../components/ui/AlertBanner';

export const RegisterPage: React.FC = () => {
  const { register, verifyEmailOtp, resendEmailOtp } = useAuth();
  const { settings } = usePlatform();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const registrationEnabled = settings.auth?.registration_enabled ?? true;
  const emailOtpEnabled = settings.auth?.email_otp_enabled ?? false;
  const cooldownDuration = settings.auth?.otp_cooldown_seconds ?? 60;

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
    acceptTerms: false,
  });

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!registrationEnabled) {
      setError('Member registrations are temporarily disabled by the administrator.');
      return;
    }

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
      if (res.requireOtp || emailOtpEnabled) {
        setStep('otp');
        setCooldown(cooldownDuration);
        setSuccessMsg(`A 6-digit confirmation code has been sent to ${formData.email}. Please verify below.`);
      } else {
        navigate('/dashboard/membership');
      }
    } else {
      setError(res.error || 'Registration could not be completed.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const res = await verifyEmailOtp(formData.email, otpCode.trim());
    setLoading(false);

    if (res.success) {
      navigate('/dashboard/membership');
    } else {
      setError(res.error || 'Invalid or expired verification code.');
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await resendEmailOtp(formData.email);
    setLoading(false);

    if (res.success) {
      setCooldown(cooldownDuration);
      setSuccessMsg('A new verification code has been dispatched to your email.');
    } else {
      setError(res.error || 'Failed to resend code. Please try again in a moment.');
    }
  };

  if (!registrationEnabled) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Registrations Temporarily Closed</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            New account registrations are paused by administration for scheduled capacity maintenance. Please check back later.
          </p>
          <div className="pt-4">
            <Link to="/login" className="text-sm font-semibold text-indigo-600 hover:underline">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <PlayCircle className="w-6 h-6 fill-white/20 stroke-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Earn<span className="text-indigo-600">zo</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">
            {step === 'otp' ? 'Verify Your Email' : 'Create Verified Member Profile'}
          </h2>
          <p className="text-xs text-slate-500">
            {step === 'otp'
              ? 'Enter the 6-digit verification code sent to your inbox'
              : 'Join the authentic sponsored video engagement platform'}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-5">
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
            {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            {step === 'form' ? (
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
                      , acknowledge that Earnzo is a reward-based engagement hub (NOT an investment scheme), and certify I will not use automated viewing bots.
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
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center pb-2">
                  <p className="text-xs text-slate-600">
                    Verification code sent to <strong className="font-bold text-slate-800">{formData.email}</strong>
                  </p>
                </div>

                <Input
                  label="6-Digit Verification Code"
                  required
                  placeholder="123456"
                  maxLength={6}
                  leftElement={<KeyRound className="w-4 h-4" />}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  helperText="Check your spam/junk folder if you do not see the email in your inbox"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="lg"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify & Continue
                </Button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setError('');
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to form</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                      cooldown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-indigo-600 hover:text-indigo-700'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </span>
                  </button>
                </div>
              </form>
            )}
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

export default RegisterPage;
