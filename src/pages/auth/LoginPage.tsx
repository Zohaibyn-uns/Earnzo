import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { AlertBanner } from '../../components/ui/AlertBanner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (email.toLowerCase().includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleDemoLogin = (type: 'user' | 'admin') => {
    if (type === 'admin') {
      setEmail('admin@earnzo.com');
      setPassword('AdminPass123!');
      login('admin@earnzo.com').then(() => navigate('/admin'));
    } else {
      setEmail('user@earnzo.com');
      setPassword('UserPass123!');
      login('user@earnzo.com').then(() => navigate('/dashboard'));
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <PlayCircle className="w-6 h-6 fill-white/20 stroke-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Earn<span className="text-indigo-600">zo</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="text-xs text-slate-500">Access your tasks, ledger wallet, and payouts</p>
        </div>

        {/* Quick Demo Pre-fill helper */}
        <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-xs space-y-2">
          <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Quick Demo Sign-In</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('user')}
              className="py-1.5 px-2 bg-white hover:bg-indigo-100/50 text-indigo-700 font-medium rounded-lg border border-indigo-200 text-xs transition-colors"
            >
              Member Demo (Ali)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              Admin HQ Demo
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-5">
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@example.com"
                leftElement={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset link has been dispatched to your email address (Simulated).');
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  leftElement={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};
