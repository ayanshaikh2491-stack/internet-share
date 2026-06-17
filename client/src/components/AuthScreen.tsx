import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, Zap, Globe, Eye, EyeOff, Activity } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('ayanshaikh2491@gmail.com'); // Default from prompt metadata
  const [password, setPassword] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Dynamic Validation
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

    // Simulate Network Exchange with Stripe-like loading feedback
    setTimeout(() => {
      setIsLoading(false);
      const userProfile: UserProfile = {
        email: email,
        joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalEarnings: 14.85, // starting balance simulation
        totalSharedBytes: 98450000000, // starting data: 98.45 GB
        totalDownloadedBytes: 2412000000, // starting downloaded: 2.41 GB
      };
      
      // Save to localStorage so state remains consistent
      localStorage.setItem('netshare_user', JSON.stringify(userProfile));
      onAuthSuccess(userProfile);
    }, 1500);
  };

  return (
    <div id="auth-screen-container" className="min-h-screen flex flex-col md:flex-row bg-[#ffffff]">
      {/* Left 50% Panel - Dark Premium Gradient (#1c1e54 → #061b31) */}
      <div 
        id="auth-brand-panel"
        className="w-full md:w-1/2 bg-gradient-to-br from-[#1c1e54] to-[#061b31] p-8 md:p-16 flex flex-col justify-between text-white relative overflow-hidden"
      >
        {/* Ambient grid or graphic lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#533afd] flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono text-[14px] font-medium tracking-wider uppercase text-white/90">
            NETSHARE ENGINE
          </span>
        </div>

        {/* Big Heading Prompt Area */}
        <div id="auth-brand-copy" className="relative z-10 my-12 md:my-0">
          <h1 className="text-[36px] lg:text-[48px] font-light tracking-[-0.96px] leading-[1.1] text-white">
            Peer-to-Peer <br />
            <span className="text-[#9688ff] font-normal">Bandwidth Exchange</span>
          </h1>
          <p className="mt-4 text-[14px] font-light text-white/70 max-w-sm leading-relaxed">
            Monetize your redundant downstream bandwidth or securely route your client applications through highly encrypted global proxy nodes.
          </p>
        </div>

        {/* 3 Trust Badges as described in prompt */}
        <div id="auth-trust-badges" className="relative z-10 space-y-5 border-t border-white/10 pt-8">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#9688ff]">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[12px] font-medium tracking-wide uppercase text-white/90">🔒 Secure Infrastructure</p>
              <p className="text-[13px] font-light text-white/60">Military-grade AES encryption tunnels for absolute telemetry obfuscation.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#9688ff]">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[12px] font-medium tracking-wide uppercase text-white/90">⚡ Dynamic Load-Balancing</p>
              <p className="text-[13px] font-light text-white/60">Zero-throttling latency metrics which scale dynamically with node distance.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#9688ff]">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[12px] font-medium tracking-wide uppercase text-white/90">🌐 Zero-Leak IP Edge</p>
              <p className="text-[13px] font-light text-white/60">Decentralized residential addresses for genuine geolocative relay capability.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right 50% Panel - White & Elegant Stripe Form */}
      <div 
        id="auth-form-panel"
        className="w-full md:w-1/2 bg-[#ffffff] p-8 md:p-16 flex flex-col justify-center"
      >
        <div className="max-w-md w-full mx-auto">
          {/* Tabs for Login / Register */}
          <div className="flex border-b border-[#e5edf5] mb-8">
            <button
              id="tab-login"
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
              className={`pb-3 pr-6 text-[14px] font-medium transition-all relative ${
                !isSignUp 
                  ? 'text-[#533afd]' 
                  : 'text-[#64748d] hover:text-[#061b31]'
              }`}
            >
              Sign In
              {!isSignUp && (
                <div className="absolute bottom-0 left-0 right-6 h-[2px] bg-[#533afd]" />
              )}
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
              className={`pb-3 px-6 text-[14px] font-medium transition-all relative ${
                isSignUp 
                  ? 'text-[#533afd]' 
                  : 'text-[#64748d] hover:text-[#061b31]'
              }`}
            >
              Create Account
              {isSignUp && (
                <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#533afd]" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-[28px] font-light tracking-tight text-[#061b31]">
                {isSignUp ? "Join NetShare Portal" : "Welcome back"}
              </h2>
              <p className="text-[14px] text-[#64748d] font-light">
                {isSignUp ? "Establish your local bandwidth nodes." : "Log in to view metrics & connections."}
              </p>
            </div>

            {/* Error ruby indicator if validation fails */}
            {errorMsg && (
              <div 
                id="error-block"
                className="p-3.5 bg-[#ea2261]/10 border border-[#ea2261]/20 rounded text-[#ea2261] text-[13px] font-light flex items-start gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#ea2261] mt-1.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field with MailIcon inside */}
            <div className="space-y-2">
              <label 
                htmlFor="input-email"
                className="text-[11px] font-medium uppercase tracking-wider text-[#273951]"
              >
                Corporate Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748d]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3 py-2.5 text-[14px] text-[#061b31] font-light border border-[#e5edf5] rounded-[4px] bg-white focus:outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label 
                  htmlFor="input-password"
                  className="text-[11px] font-medium uppercase tracking-wider text-[#273951]"
                >
                  Password ID
                </label>
                <span className="text-[12px] font-light text-[#533afd] hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748d]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-[14px] text-[#061b31] font-light border border-[#e5edf5] rounded-[4px] bg-white focus:outline-none transition-all placeholder:text-gray-300"
                />
                <button
                  id="toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748d]/70 hover:text-[#533afd] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Optional Remember Card (Stripe Design Theme Toggle) */}
            <div className="flex items-center gap-2">
              <input 
                id="checkbox-remember" 
                type="checkbox" 
                defaultChecked 
                className="w-4.5 h-4.5 border-[#e5edf5] rounded text-[#533afd] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="checkbox-remember" className="text-[13px] font-light text-[#64748d] cursor-pointer select-none">
                Remember this physical apparatus for 30 cycles
              </label>
            </div>

            {/* Handle Form CTA */}
            <button
              id="submit-auth-form"
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3.5 text-[14px] font-normal leading-5 text-white bg-[#533afd] rounded-[4px] hover:opacity-95 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_6px_rgba(50,50,93,0.11),_0_1px_3px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait…
                </span>
              ) : (
                <span>{isSignUp ? 'Generate Node Credentials' : 'Authenticate Netshare Session'}</span>
              )}
            </button>

            {/* Quick Demo Assist */}
            <div className="pt-4 border-t border-[#e5edf5] text-center">
              <p className="text-[12px] font-light text-[#64748d]">
                For instant triage, use preloaded credentials and click <span className="text-[#533afd] font-medium">Authenticate</span>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
