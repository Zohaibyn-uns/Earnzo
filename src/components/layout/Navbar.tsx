import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PlayCircle, Menu, X, ShieldCheck, ArrowRight, User, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout, switchRole } = useAuth();
  const { hasActivePlan, activePlan, toggleDemoMembership } = usePlatform();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation matching Section 17
  interface NavLinkItem {
    name: string;
    href: string;
    highlight?: boolean;
  }

  const loggedInLinks: NavLinkItem[] = [
    { name: 'Home', href: '/' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Plans', href: '/plans' },
    { name: 'Earn', href: '/earn', highlight: true },
    { name: 'Wallet', href: '/wallet' },
    { name: 'Referrals', href: '/referrals' },
    { name: 'Withdraw', href: '/withdraw' },
    { name: 'Profile', href: '/profile' },
  ];

  const publicLinks: NavLinkItem[] = [
    { name: 'Home', href: '/' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Plans', href: '/plans' },
    { name: 'Earn', href: '/earn' },
    { name: 'FAQ', href: '/faq' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const navLinks: NavLinkItem[] = isAuthenticated ? loggedInLinks : publicLinks;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Top Compliance Bar with demo state controls */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-8 text-center flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Regulated Reward-Based Sponsored Video Network • Not an Investment Platform</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto text-[11px]">
          <span className="text-slate-400 hidden sm:inline">Demo Switcher:</span>
          {/* Plan state toggle */}
          <button
            onClick={toggleDemoMembership}
            className={`px-2 py-0.5 rounded font-semibold text-[10px] transition-colors ${
              hasActivePlan ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Plan active/unsubscribed to test locked vs unlocked Earn states"
          >
            {hasActivePlan ? `Active: ${activePlan?.name}` : 'No Active Plan'}
          </button>
          {/* User vs Admin view toggle */}
          <button
            onClick={() => switchRole('user')}
            className={`px-2 py-0.5 rounded font-medium ${
              user?.role === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            User
          </button>
          <button
            onClick={() => switchRole('admin')}
            className={`px-2 py-0.5 rounded font-medium ${
              user?.role === 'admin' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <PlayCircle className="w-6 h-6 fill-white/20 stroke-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Watch<span className="text-indigo-600">Earn</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider -mt-1 uppercase">
              Sponsored Video Hub
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`transition-colors py-1 flex items-center gap-1.5 ${
                isActive(link.href)
                  ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{link.name}</span>
              {link.highlight && (
                <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-bold rounded">
                  Earn
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <Link to="/admin">
                  <Button variant="secondary" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4 text-amber-600" />}>
                    Admin Panel
                  </Button>
                </Link>
              ) : (
                <Link to="/dashboard">
                  <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                  isActive(link.href)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{link.name}</span>
                {link.highlight && (
                  <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-bold rounded">
                    Earn
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="primary" className="w-full">
                    {isAdmin ? 'Admin Panel' : 'Dashboard'}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Register Now
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
