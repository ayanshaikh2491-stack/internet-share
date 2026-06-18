import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Share2, Zap, Shield, Globe, Activity } from 'lucide-react';
import type { UserProfile } from '../types';
import { auth } from '../services/auth';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const action = isSignUp ? auth.register(email, password) : auth.login(email, password);
    action
      .then(result => {
        setIsLoading(false);
        if (!result.success) {
          setErrorMsg(result.error || 'Authentication failed');
          return;
        }
        const userData = auth.getUser();
        onAuthSuccess({
          email: userData?.email || email,
          joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          totalEarnings: 0,
          totalSharedBytes: 0,
          totalDownloadedBytes: 0,
        });
      })
      .catch(() => {
        setIsLoading(false);
        setErrorMsg('Server unreachable. Make sure the relay server is running.');
      });
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col md:flex-row">
      {/* ─── Left Panel: Branding ───────────────────────────────── */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#0f0f12] via-[#1a1a2e] to-[#0f0f12] px-6 py-8 md:p-16 flex flex-col justify-center md:justify-between relative overflow-hidden min-h-[40vh] md:min-h-screen">
        {/* Ambient grid lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#7c3aed_1px,transparent_1px),linear-gradient(to_bottom,#7c3aed_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#06b6d4]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-[#7c3aed]/30">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-[0.15em] uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: '#7c3aed' }}>
            ShareNet
          </span>
        </div>

        {/* Big Copy */}
        <div className="relative z-10 my-6 md:my-0">
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <span className="text-white">Peer-to-Peer</span>
            <br />
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#06b6d4] to-[#7c3aed] bg-clip-text text-transparent">
              Internet Sharing
            </span>
          </h1>
          <p className="mt-4 text-sm text-gray-400 max-w-sm leading-relaxed">
            Share your bandwidth or browse through encrypted peer tunnels. Decentralized, secure, and open.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="relative z-10 space-y-5 border-t border-white/5 pt-8">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#06b6d4]" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-300" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Secure Infrastructure
              </p>
              <p className="text-xs text-gray-500 mt-0.5">End-to-end encrypted tunnels with military-grade AES</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-[#06b6d4]" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-300" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Low Latency
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Optimized routing with minimal packet overhead</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-[#06b6d4]" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-300" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Global Mesh
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Connect to nodes worldwide in a decentralized network</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Auth Form ─────────────────────────────── */}
      <div className="w-full md:w-1/2 bg-[#0f0f12] p-8 md:p-16 flex flex-col justify-center relative">
        <div className="max-w-md w-full mx-auto relative z-10">
          {/* Tabs */}
          <div className="flex border-b border-white/5 mb-8">
            <button
              id="tab-login"
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
              className={`pb-3 pr-6 text-sm font-medium transition-all relative ${
                !isSignUp
                  ? 'text-[#7c3aed]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
              {!isSignUp && (
                <div className="absolute bottom-0 left-0 right-6 h-0.5 bg-[#7c3aed]" />
              )}
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
              className={`pb-3 px-6 text-sm font-medium transition-all relative ${
                isSignUp
                  ? 'text-[#7c3aed]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Create Account
              {isSignUp && (
                <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-[#7c3aed]" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {isSignUp ? 'New Node' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-gray-500">
                {isSignUp ? 'Create your ShareNet credentials' : 'Sign in to your ShareNet account'}
              </p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="input-email" className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-3 text-sm text-white bg-[#1a1a2e] border border-white/10 rounded-xl focus:outline-none focus:border-[#7c3aed]/50 focus:ring-1 focus:ring-[#7c3aed]/20 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="input-password" className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <span className="text-xs text-[#7c3aed] hover:text-[#8b5cf6] transition-colors cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm text-white bg-[#1a1a2e] border border-white/10 rounded-xl focus:outline-none focus:border-[#7c3aed]/50 focus:ring-1 focus:ring-[#7c3aed]/20 transition-all placeholder:text-gray-600"
                />
                <button
                  id="toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#7c3aed] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="submit-auth-form"
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </span>
              ) : (
                <>
                  <Activity className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-xs text-gray-600 bg-[#0f0f12]">secure connection</span>
              </div>
            </div>

            {/* Footer text */}
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Use your credentials to access the ShareNet protocol.
                <br />
                No personal data is stored on the network.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
