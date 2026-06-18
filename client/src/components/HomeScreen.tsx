import { LogOut, Wifi, Share2, Cpu, Globe, Users, Zap } from 'lucide-react';
import type { UserProfile, ActiveView } from '../types';

interface HomeScreenProps {
  user: UserProfile;
  onSelectView: (view: ActiveView) => void;
  onLogout: () => void;
}

export default function HomeScreen({ user, onSelectView, onLogout }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col">
      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-[#7c3aed]/30 px-6 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl" style={{ fontFamily: "'Orbitron', sans-serif", color: '#7c3aed', letterSpacing: '0.05em' }}>
                SHARENET
              </h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">Internet Sharing Protocol</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f0f12] border border-white/5">
              <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" style={{ boxShadow: '0 0 6px #10b981' }} />
              <span className="text-xs text-gray-400">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-[#ec4899] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-[slideUp_0.5s_ease-out]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#7c3aed] text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>Peer-to-peer network active</span>
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <span className="text-white">Choose your</span>
            <br />
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#06b6d4] to-[#7c3aed] bg-clip-text text-transparent">
              role
            </span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto font-light">
            Share your internet connection or browse the web through a peer's network
          </p>
        </div>

        {/* ─── Two Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Card 1: Share Internet (Donor) */}
          <div
            id="card-mode-donor"
            className="group relative bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-2xl p-8 hover:border-[#7c3aed]/50 transition-all duration-300 flex flex-col"
            style={{
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7c3aed]/0 via-[#7c3aed]/5 to-[#06b6d4]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col">
              {/* Icon + Badge */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/10 border border-[#7c3aed]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="w-7 h-7 text-[#7c3aed]" />
                </div>
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20">
                  Donor
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-2xl md:text-3xl font-bold mb-3 text-white group-hover:text-[#7c3aed] transition-colors"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                Share Internet
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                Let others use your internet connection. Earn rewards and help build a decentralized mesh network.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-[#7c3aed]/10 flex items-center justify-center">
                    <Wifi className="w-3 h-3 text-[#06b6d4]" />
                  </div>
                  <span>Unlimited bandwidth sharing</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-[#7c3aed]/10 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-[#06b6d4]" />
                  </div>
                  <span>Secure encrypted relays</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-[#7c3aed]/10 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-[#10b981]" />
                  </div>
                  <span>Real-time connection tracking</span>
                </div>
              </div>

              {/* CTA */}
              <button
                id="btn-goto-donor"
                onClick={() => onSelectView('donor')}
                className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer relative overflow-hidden group/btn"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
                }}
              >
                <span className="relative z-10">Start Sharing</span>
                <Share2 className="w-4 h-4 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>

          {/* Card 2: Join Network (Receiver) */}
          <div
            id="card-mode-receiver"
            className="group relative bg-[#1a1a2e] border border-[#ec4899]/20 rounded-2xl p-8 hover:border-[#ec4899]/50 transition-all duration-300 flex flex-col"
            style={{
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ec4899]/0 via-[#ec4899]/5 to-[#7c3aed]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col">
              {/* Icon + Badge */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ec4899]/20 to-[#7c3aed]/10 border border-[#ec4899]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-7 h-7 text-[#ec4899]" />
                </div>
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20">
                  Receiver
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-2xl md:text-3xl font-bold mb-3 text-white group-hover:text-[#ec4899] transition-colors"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                Join Network
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                Connect through a peer's internet tunnel. Browse the web anonymously with encrypted routing.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-[#ec4899]/10 flex items-center justify-center">
                    <Globe className="w-3 h-3 text-[#ec4899]" />
                  </div>
                  <span>Browse through peer networks</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-[#ec4899]/10 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-[#ec4899]" />
                  </div>
                  <span>End-to-end encrypted tunnel</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-[#ec4899]/10 flex items-center justify-center">
                    <Users className="w-3 h-3 text-[#10b981]" />
                  </div>
                  <span>Connect to any donor node</span>
                </div>
              </div>

              {/* CTA */}
              <button
                id="btn-goto-receiver"
                onClick={() => onSelectView('receiver')}
                className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer relative overflow-hidden group/btn"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
                  boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)',
                }}
              >
                <span className="relative z-10">Join Network</span>
                <Globe className="w-4 h-4 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#ec4899] to-[#db2777] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ────────────────────────────────────────── */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-[#1a1a2e]/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#7c3aed]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {user.totalEarnings.toFixed(2)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">USD Earned</p>
          </div>
          <div className="bg-[#1a1a2e]/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#06b6d4]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {(user.totalSharedBytes / 1e9).toFixed(1)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">GB Shared</p>
          </div>
          <div className="bg-[#1a1a2e]/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#10b981]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {(user.totalDownloadedBytes / 1e6).toFixed(1)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">MB Downloaded</p>
          </div>
          <div className="bg-[#1a1a2e]/50 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#ec4899]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {user.joinedAt}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Joined</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Used by features list - imported here to avoid unused imports
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function Lock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
