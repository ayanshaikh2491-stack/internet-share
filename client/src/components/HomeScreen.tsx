import { Share2, Globe, Wifi } from 'lucide-react';
import type { UserProfile } from '../types';

interface HomeScreenProps {
  user: UserProfile;
  onSelectView: (view: 'auth' | 'home' | 'donor' | 'receiver') => void;
  onLogout: () => void;
}

export default function HomeScreen({ user, onSelectView, onLogout }: HomeScreenProps) {
  const initials = user.email
    .split('@')[0]
    .split(/[._-]/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col">
      {/* Skip link */}
      <a href="#role-selection" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-[var(--radius-sm)] focus:text-sm focus:font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50">
        Skip to role selection
      </a>

      {/* Header */}
      <header className="bg-[var(--canvas-elevated)] border-b border-[var(--hairline)] px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-[var(--ink)] truncate" style={{ fontFamily: 'Orbitron, sans-serif' }}>Internet Share</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[11px] font-semibold text-[var(--primary)]" aria-hidden="true">
                {initials}
              </div>
              <span className="text-[13px] text-[var(--body)] max-w-[180px] truncate">{user.email}</span>
            </div>
            <div className="sm:hidden w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[11px] font-semibold text-[var(--primary)]" aria-label={user.email}>
              {initials}
            </div>
            <button
              onClick={onLogout}
              className="text-[12px] text-[var(--body)] hover:text-[var(--ink)] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:rounded px-1 py-0.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main id="role-selection" className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-[var(--ink)] tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>Choose your role</h1>
          <p className="text-[14px] sm:text-[15px] text-[var(--body)] mt-2 max-w-md mx-auto">Share your internet connection or browse through a peer&apos;s network</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Share Card */}
          <button
            onClick={() => onSelectView('donor')}
            className="group bg-[var(--canvas-elevated)] rounded-[var(--radius-xl)] border border-[var(--hairline)] p-6 sm:p-8 text-left hover:border-[var(--primary)]/40 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
            style={{ transition: 'all 0.2s ease' }}
          >
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform" aria-hidden="true">
              <Share2 className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Share Internet</h2>
            <p className="text-[14px] text-[var(--body)] leading-relaxed">Let someone use your connection. Create a room and share the code.</p>
          </button>

          {/* Join Card */}
          <button
            onClick={() => onSelectView('receiver')}
            className="group bg-[var(--canvas-elevated)] rounded-[var(--radius-xl)] border border-[var(--hairline)] p-6 sm:p-8 text-left hover:border-[var(--accent-pink)]/40 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
            style={{ transition: 'all 0.2s ease' }}
          >
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--accent-pink)]/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform" aria-hidden="true">
              <Globe className="w-6 h-6 text-[var(--accent-pink)]" />
            </div>
            <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Join Network</h2>
            <p className="text-[14px] text-[var(--body)] leading-relaxed">Connect using a room code and browse through someone&apos;s connection.</p>
          </button>
        </div>
      </main>
    </div>
  );
}
