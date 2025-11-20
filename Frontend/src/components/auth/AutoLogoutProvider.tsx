import { useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import SessionTimeoutWarning from './SessionTimeoutWarning'
import { useThemeStore } from '@/store/themeStore'

export default function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth()
  const neoBrutalismMode = useThemeStore((state) => state.neoBrutalismMode)
  const [showWarning, setShowWarning] = useState(false)

  useAutoLogout({
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    warningTimeout: 5 * 60 * 1000, // Show warning 5 minutes before logout
    onWarning: () => {
      setShowWarning(true)
    },
    onLogout: () => {
      setShowWarning(false)
    },
  })

  const handleStayLoggedIn = () => {
    setShowWarning(false)
    // Reset timer by triggering activity
    window.dispatchEvent(new Event('mousedown'))
  }

  const handleLogout = () => {
    setShowWarning(false)
    logout()
  }

  return (
    <>
      {children}
      {isAuthenticated && (
        <SessionTimeoutWarning
          open={showWarning}
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={handleLogout}
          secondsRemaining={5 * 60} // 5 minutes
          neoBrutalismMode={neoBrutalismMode}
        />
      )}
    </>
  )
}

