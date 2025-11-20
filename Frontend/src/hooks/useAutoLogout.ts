import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { ROUTES } from '@/constants/routes'
import { authService } from '@/lib/api/authService'

interface UseAutoLogoutOptions {
  inactivityTimeout?: number // milliseconds (default: 30 minutes)
  warningTimeout?: number // milliseconds before logout to show warning (default: 5 minutes)
  onWarning?: () => void
  onLogout?: () => void
}

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    inactivityTimeout = 30 * 60 * 1000, // 30 minutes
    warningTimeout = 5 * 60 * 1000, // 5 minutes before logout
    onWarning,
    onLogout,
  } = options

  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningShownRef = useRef(false)

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }
    warningShownRef.current = false

    if (!isAuthenticated) return

    // Set warning timer (show warning before logout)
    warningTimeoutRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning()
        warningShownRef.current = true
      }
    }, inactivityTimeout - warningTimeout)

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      // Verify token before logout
      const isValid = await authService.verifyToken()
      if (!isValid) {
        logout()
        navigate(ROUTES.LOGIN)
        if (onLogout) {
          onLogout()
        }
      } else {
        // Token is still valid, reset timer
        resetTimer()
      }
    }, inactivityTimeout)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timers if not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      return
    }

    // Events that reset the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetTimer()
    }

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Initialize timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
    }
  }, [isAuthenticated, inactivityTimeout, warningTimeout, onWarning, onLogout, logout, navigate])

  return {
    resetTimer,
  }
}

