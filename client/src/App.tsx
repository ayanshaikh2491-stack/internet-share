import { useState, useEffect, useCallback, useRef } from 'react'
import { TunnelClient } from './services/tunnel'
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
  const tunnelRef = useRef<TunnelClient | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    if (auth.isAuthenticated()) {
      auth.getToken()
      const storedUser = auth.getUser()
      if (storedUser) {
        setUser({
          email: storedUser.email,
          joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          totalEarnings: 0,
          totalSharedBytes: 0,
          totalDownloadedBytes: 0,
        })
      }
      setScreen('home')
    }
    setLoading(false)
  }, [])

  // Connect tunnel when authenticated
  useEffect(() => {
    if (screen === 'auth' || !user) return

    const token = auth.getToken() || undefined
    const tunnel = new TunnelClient(SERVER_URL, {
      onMessage: () => {},
      onStateChange: () => {},
      token,
    })
    tunnelRef.current = tunnel
    tunnel.connect()
    return () => tunnel.disconnect()
  }, [screen, user])

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile)
    setScreen('home')
  }

  const handleLogout = () => {
    auth.logout()
    setUser(null)
    setScreen('auth')
    if (tunnelRef.current) tunnelRef.current.disconnect()
  }

  const handleBack = () => {
    setScreen('home')
    if (tunnelRef.current) tunnelRef.current.leaveAll()
  }

  const updateUser = useCallback((updated: UserProfile) => {
    setUser(updated)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f6f9fc' }}>
        <div className="w-6 h-6 rounded-[2px] border-2 border-[#e5edf5] border-t-[#533afd] animate-spin" />
      </div>
    )
  }

  if (screen === 'auth') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />
  }

  if (screen === 'home') {
    return <HomeScreen user={user!} onSelectView={setScreen} onLogout={handleLogout} />
  }

  if (screen === 'donor') {
    return <DonorDashboard user={user!} onUpdateUser={updateUser} onBack={handleBack} />
  }

  if (screen === 'receiver') {
    return <ReceiverJoin user={user!} onUpdateUser={updateUser} onBack={handleBack} />
  }

  return null
}

export default App