import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { Sparkles, X } from 'lucide-react';

export const WelcomeMessageModal: React.FC = () => {
  const { user } = useAuth();
  const { settings } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);

  const welcomeConfig = settings.welcomeMessage || {
    enabled: true,
    new_user_title: 'Welcome to Earnzo! 🎉',
    new_user_message: 'Hi {name}, start earning today by completing tasks and inviting friends!',
    returning_user_title: 'Welcome Back! 👋',
    returning_user_message: 'Hi {name}, great to see you again! Check out your new daily tasks.',
    display_duration_seconds: 6,
  };

  useEffect(() => {
    if (!user || !welcomeConfig.enabled) {
      setIsOpen(false);
      return;
    }

    // Determine session flag to prevent annoying popups on every page reload/tab switch
    const today = new Date().toISOString().split('T')[0];
    const sessionKey = `earnzo_welcome_shown_${user.id}_${today}`;
    const alreadyShown = sessionStorage.getItem(sessionKey);

    if (alreadyShown) {
      return;
    }

    // Show message
    setIsOpen(true);
    sessionStorage.setItem(sessionKey, 'true');

    // Auto-dismiss timer if configured (> 0 seconds)
    const duration = (welcomeConfig.display_duration_seconds || 6) * 1000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [user, welcomeConfig.enabled, welcomeConfig.display_duration_seconds]);

  if (!isOpen || !user || !welcomeConfig.enabled) {
    return null;
  }

  // Check if new user (account created within last 24 hours)
  const isNewUser = (() => {
    if (!user.created_at) return false;
    const createdDate = new Date(user.created_at).getTime();
    const now = Date.now();
    return now - createdDate < 24 * 60 * 60 * 1000;
  })();

  const titleTemplate = isNewUser
    ? welcomeConfig.new_user_title || 'Welcome to Earnzo! 🎉'
    : welcomeConfig.returning_user_title || 'Welcome Back! 👋';

  const messageTemplate = isNewUser
    ? welcomeConfig.new_user_message || 'Hi {name}, start earning today by completing tasks and inviting friends!'
    : welcomeConfig.returning_user_message || 'Hi {name}, great to see you again! Check out your new daily tasks.';

  const userName = user.full_name || user.email?.split('@')[0] || 'Member';
  const formattedTitle = titleTemplate.replace('{name}', userName);
  const formattedMessage = messageTemplate.replace('{name}', userName);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 text-white rounded-2xl shadow-2xl p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl flex-shrink-0 border border-emerald-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-4 min-w-0">
          <h4 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
            {formattedTitle}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed break-words">
            {formattedMessage}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors flex-shrink-0"
          aria-label="Close welcome message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeMessageModal;
