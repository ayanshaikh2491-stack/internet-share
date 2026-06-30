import { useState, useEffect } from 'react'
import { TunnelClient } from './services/tunnel'
import { setGlobalTunnel } from './services/tunnel'
import { auth } from './services/auth'
import type { UserProfile } from './types'
import AuthScreen from './components/AuthScreen'
import HomeScreen from './components/HomeScreen'
import DonorDashboard from './components/DonorDashboard'
import ReceiverJoin from './components/ReceiverJoin'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001'

function App() {
  const [screen, setScreen] = useState<'auth' | 'home' | 'donor' | 'receiver'>('auth')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    if (auth.isAuthenticated()) {
      const storedUser = auth.getUser()
      if (storedUser) {
        setUser({
          email: storedUser.email,
          joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          totalEarnings: 0,
          totalSharedBytes: 0,
          totalDownloadedBytes: 0,
        })
        setScreen('home')
      }
    }
    setLoading(false)
  }, [])

  // Connect tunnel once user is authenticated
  useEffect(() => {
    if (screen === 'auth' || !user) return
    const token = auth.getToken() || undefined
    const tunnel = new TunnelClient(SERVER_URL, { onMessage: () => {}, onStateChange: () => {}, token })
    setGlobalTunnel(tunnel)
    tunnel.connect()
    return () => { tunnel.disconnect(); setGlobalTunnel(null) }
  }, [screen, user])

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile)
    setScreen('home')
  }

  const handleLogout = () => {
    auth.logout()
    setUser(null)
    setScreen('auth')
  }

  const handleBack = () => {
    setScreen('home')
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--canvas)] gap-3" role="status" aria-live="polite">
      <div className="w-5 h-5 rounded-sm border-2 border-[var(--hairline)] border-t-[var(--primary)] animate-spin" aria-hidden="true" />
      <p className="text-xs text-[var(--muted)] font-mono">Connecting...</p>
    </div>
  )

  return (
    <div className="min-h-screen">
      {screen === 'auth' && <AuthScreen onAuthSuccess={handleAuthSuccess} />}
      {screen === 'home' && <HomeScreen user={user!} onSelectView={setScreen} onLogout={handleLogout} />}
      {screen === 'donor' && <DonorDashboard user={user!} onBack={handleBack} />}
      {screen === 'receiver' && <ReceiverJoin onBack={handleBack} />}
    </div>
  )
}

export default App
