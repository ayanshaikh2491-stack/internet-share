import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import type { UserProfile } from '../types';
import { auth } from '../services/auth';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Enter a valid email');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    const action = isSignUp ? auth.register(email, password) : auth.login(email, password);
    const result = await action;
    setIsLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Authentication failed');
      return;
    }
    const userData = auth.getUser();
    onAuthSuccess({ email: userData?.email || email, joinedAt: '', totalEarnings: 0, totalSharedBytes: 0, totalDownloadedBytes: 0 });
  };

  const errorId = 'auth-error-desc';
  const emailId = 'auth-email-desc';

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* Skip link */}
      <a href="#auth-form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-[var(--radius-sm)] focus:text-sm focus:font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50">
        Skip to form
      </a>

      {/* Logo */}
      <div className="mb-8 sm:mb-10 text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-[var(--radius-sm)] bg-[var(--primary)] flex items-center justify-center" aria-hidden="true">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <h1 className="text-[22px] font-semibold text-[var(--ink)] tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>Internet Share</h1>
        <p className="text-sm text-[var(--body)] mt-1.5">Share your connection securely</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-[var(--canvas-elevated)] rounded-[var(--radius-lg)] border border-[var(--hairline)] p-6 sm:p-7">
        <h2 className="text-[18px] font-medium text-[var(--ink)] mb-6">{isSignUp ? 'Create account' : 'Sign in'}</h2>

        {errorMsg && (
          <div
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="mb-4 px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 text-[13px] text-[var(--accent-red)]"
          >
            {errorMsg}
          </div>
        )}

        <form id="auth-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="auth-email" className="block text-[12px] font-medium text-[var(--ink)] mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-describedby={errorMsg ? errorId : emailId}
                autoComplete="email"
                required
                className="w-full pl-9 pr-3 py-2.5 text-[14px] rounded-[var(--radius-sm)] border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
              />
            </div>
            {!errorMsg && <p id={emailId} className="sr-only">Enter your email address</p>}
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-[12px] font-medium text-[var(--ink)] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" aria-hidden="true" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                aria-describedby={errorMsg ? errorId : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className="w-full pl-9 pr-10 py-2.5 text-[14px] rounded-[var(--radius-sm)] border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:rounded transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full py-2.5 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white text-[14px] font-medium hover:bg-[var(--primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas-elevated)]"
            style={{ boxShadow: 'var(--shadow-glow-primary)' }}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create account' : 'Sign in'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-[13px] text-[var(--body)]">
          {isSignUp ? (
            <>Already have an account? <button onClick={() => setIsSignUp(false)} className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium focus:outline-none focus-visible:underline">Sign in</button></>
          ) : (
            <>Don&apos;t have an account? <button onClick={() => setIsSignUp(true)} className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium focus:outline-none focus-visible:underline">Create one</button></>
          )}
        </div>
      </div>
    </div>
  );
}
