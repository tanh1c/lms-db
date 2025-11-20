import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthProvider'
import { ROUTES } from '@/constants/routes'
import { authService } from '@/lib/api/authService'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { getGlassmorphismCardClasses, getGlassmorphismButtonClasses, getGlassmorphismInputClasses } from '@/lib/utils/theme-utils'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import '@/lib/animations/gsap-setup'

type ThemeMode = 'normal' | 'neo-brutalism' | 'glassmorphism'

export default function LoginPage() {
  const { t } = useTranslation()
  const [universityId, setUniversityId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>('normal')
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const neoBrutalismMode = themeMode === 'neo-brutalism'
  const glassmorphismMode = themeMode === 'glassmorphism'

  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current.children, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      })
    }
  }, { scope: containerRef })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authService.login(universityId, password, rememberMe)
      if (result.success && result.user && result.role && result.token) {
        login(result.user, result.role, result.token, result.rememberMe || rememberMe)
        
        // Navigate based on role
        if (result.role === 'student') {
          navigate(ROUTES.STUDENT_DASHBOARD)
        } else if (result.role === 'tutor') {
          navigate(ROUTES.TUTOR_DASHBOARD)
        } else if (result.role === 'admin') {
          navigate(ROUTES.ADMIN_DASHBOARD)
        }
      } else {
        setError(result.error || t('auth.loginError'))
      }
    } catch (err) {
      setError(t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center px-4 relative",
      neoBrutalismMode 
        ? "bg-[#FFFBEB] dark:bg-[#1a1a1a] neo-brutalism-bg"
        : glassmorphismMode
        ? "glassmorphism-bg"
        : "bg-white dark:bg-black"
    )}>
      {/* Theme Selector & Language Switcher - Góc trên phải */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <LanguageSwitcher />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setThemeMode('normal')}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg transition-all",
            themeMode === 'normal'
              ? glassmorphismMode
                ? "bg-white/40 dark:bg-white/30 text-white font-semibold border border-white/60 backdrop-blur-sm shadow-lg"
                : "bg-black dark:bg-white text-white dark:text-black font-semibold"
              : glassmorphismMode
              ? "bg-white/20 dark:bg-white/15 text-white/90 font-medium border border-white/30 backdrop-blur-sm hover:bg-white/30 hover:border-white/50 shadow-md"
              : "bg-white/10 dark:bg-black/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20"
          )}
        >
          Normal
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setThemeMode('neo-brutalism')}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg transition-all",
            themeMode === 'neo-brutalism'
              ? glassmorphismMode
                ? "bg-white/40 dark:bg-white/30 text-white font-bold border-2 border-white/60 backdrop-blur-sm shadow-lg"
                : "bg-[#1a1a1a] dark:bg-[#FFFBEB] text-white dark:text-[#1a1a1a] font-bold border-2 border-[#1a1a1a] dark:border-[#FFFBEB]"
              : glassmorphismMode
              ? "bg-white/20 dark:bg-white/15 text-white/90 font-medium border border-white/30 backdrop-blur-sm hover:bg-white/30 hover:border-white/50 shadow-md"
              : "bg-white/10 dark:bg-black/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20"
          )}
        >
          Neo-Brutalism
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setThemeMode('glassmorphism')}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg transition-all backdrop-blur-sm",
            themeMode === 'glassmorphism'
              ? "bg-white/30 dark:bg-white/20 text-white font-semibold border border-white/50"
              : "bg-white/10 dark:bg-black/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20"
          )}
        >
          Glassmorphism
        </Button>
      </div>

      <div ref={containerRef} className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={cn(
              neoBrutalismMode 
                ? "neo-brutalism-logo-container"
                : glassmorphismMode
                ? "p-2 bg-white/20 dark:bg-black/20 backdrop-blur-[20px] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/30 dark:border-white/20"
                : "p-2 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-200 dark:border-[#333]"
            )}>
              <img 
                src="/HCMCUT.png" 
                alt="HCMUT Logo" 
                className="w-[60px] h-[60px] object-contain"
              />
            </div>
            <span className={cn(
              "text-4xl font-bold",
              neoBrutalismMode 
                ? "text-[#1a1a1a] dark:text-[#FFFBEB] neo-brutalism-text"
                : glassmorphismMode
                ? "text-white drop-shadow-lg"
                : "text-[#211c37] dark:text-white"
            )}>LMS</span>
          </div>
          <h1 className={cn(
            "text-3xl font-bold mb-2",
            neoBrutalismMode 
              ? "text-[#1a1a1a] dark:text-[#FFFBEB] neo-brutalism-text"
              : glassmorphismMode
              ? "text-white drop-shadow-lg"
              : "text-[#211c37] dark:text-white"
          )}>{t('auth.loginTitle')}</h1>
          <p className={cn(
            "text-base font-semibold opacity-80",
            neoBrutalismMode 
              ? "text-[#1a1a1a] dark:text-[#FFFBEB]"
              : glassmorphismMode
              ? "text-white/90 drop-shadow-md"
              : "text-[#676767] dark:text-gray-400"
          )}>{t('auth.loginSubtitle')}</p>
        </div>
        
        <Card className={cn(
          "p-8",
          neoBrutalismMode
            ? "neo-brutalism-card border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
            : glassmorphismMode
            ? getGlassmorphismCardClasses(glassmorphismMode, "p-8")
            : "border border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl"
        )}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={cn(
                "bg-red-500 dark:bg-red-600 text-white px-4 py-3 text-sm font-semibold",
                neoBrutalismMode
                  ? "neo-brutalism-error border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : glassmorphismMode
                  ? "bg-red-500/80 dark:bg-red-600/80 backdrop-blur-[20px] border border-red-300/50 dark:border-red-400/50 rounded-[20px] shadow-[0_8px_32px_rgba(220,38,38,0.3)]"
                  : "rounded-lg border border-red-600 dark:border-red-700"
              )}>
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="universityId" className={cn(
                "block text-sm font-medium",
                neoBrutalismMode
                  ? "font-bold text-[#1a1a1a] dark:text-[#FFFBEB]"
                  : glassmorphismMode
                  ? "text-white drop-shadow-md"
                  : "text-[#211c37] dark:text-white"
              )}>
                {t('auth.universityId')}
              </label>
              <Input
                id="universityId"
                type="text"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className={cn(
                  "w-full h-14 transition-all",
                  neoBrutalismMode
                    ? "neo-brutalism-input border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#1a1a1a] text-[#1a1a1a] dark:text-[#FFFBEB] rounded-none font-semibold focus:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                    : glassmorphismMode
                    ? getGlassmorphismInputClasses(glassmorphismMode, "w-full h-14")
                    : "border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#211c37] dark:text-white rounded-xl focus:ring-2 focus:ring-[#3bafa8]"
                )}
                placeholder={t('auth.universityIdPlaceholder')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className={cn(
                "block text-sm font-medium",
                neoBrutalismMode
                  ? "font-bold text-[#1a1a1a] dark:text-[#FFFBEB]"
                  : glassmorphismMode
                  ? "text-white drop-shadow-md"
                  : "text-[#211c37] dark:text-white"
              )}>
                {t('auth.password')}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full h-14 transition-all",
                  neoBrutalismMode
                    ? "neo-brutalism-input border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#1a1a1a] text-[#1a1a1a] dark:text-[#FFFBEB] rounded-none font-semibold focus:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                    : glassmorphismMode
                    ? getGlassmorphismInputClasses(glassmorphismMode, "w-full h-14")
                    : "border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#211c37] dark:text-white rounded-xl focus:ring-2 focus:ring-[#3bafa8]"
                )}
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className={cn(
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB]"
                    : ""
                )}
              />
              <label
                htmlFor="rememberMe"
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  neoBrutalismMode
                    ? "font-bold text-[#1a1a1a] dark:text-[#FFFBEB]"
                    : glassmorphismMode
                    ? "text-white drop-shadow-md"
                    : "text-[#211c37] dark:text-white"
                )}
              >
                {t('auth.rememberMe')}
              </label>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-14 font-bold text-base transition-all",
                neoBrutalismMode
                  ? "neo-brutalism-button bg-[#1a1a1a] dark:bg-[#FFFBEB] text-white dark:text-[#1a1a1a] rounded-none border-4 border-[#1a1a1a] dark:border-[#FFFBEB] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  : glassmorphismMode
                  ? getGlassmorphismButtonClasses(glassmorphismMode, 'primary', "w-full h-14 font-bold text-base")
                  : "bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

