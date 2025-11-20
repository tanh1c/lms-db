import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getNeoBrutalismButtonClasses, getNeoBrutalismTextClasses } from '@/lib/utils/theme-utils'

interface SessionTimeoutWarningProps {
  open: boolean
  onStayLoggedIn: () => void
  onLogout: () => void
  secondsRemaining: number
  neoBrutalismMode?: boolean
}

export default function SessionTimeoutWarning({
  open,
  onStayLoggedIn,
  onLogout,
  secondsRemaining,
  neoBrutalismMode = false,
}: SessionTimeoutWarningProps) {
  const { t } = useTranslation()
  const [countdown, setCountdown] = useState(secondsRemaining)

  useEffect(() => {
    if (!open) return

    setCountdown(secondsRemaining)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, secondsRemaining])

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className={cn(
        "sm:max-w-md",
        neoBrutalismMode ? "neo-brutalism-card border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]" : ""
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-xl",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
          )}>
            {t('auth.sessionTimeoutWarning')}
          </DialogTitle>
          <DialogDescription className={cn(
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('auth.sessionTimeoutMessage', { 
              minutes: minutes.toString().padStart(2, '0'),
              seconds: seconds.toString().padStart(2, '0')
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            onClick={onStayLoggedIn}
            className={cn(
              neoBrutalismMode
                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary')
                : ""
            )}
          >
            {t('auth.stayLoggedIn')}
          </Button>
          <Button
            variant="outline"
            onClick={onLogout}
            className={cn(
              neoBrutalismMode
                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                : ""
            )}
          >
            {t('auth.logout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

