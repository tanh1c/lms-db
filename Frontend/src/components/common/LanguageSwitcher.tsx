import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNeoBrutalismMode, useGlassmorphismMode } from '@/lib/utils/theme-utils'
import { Languages } from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'default' | 'settings'
}

export default function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageStore()
  const neoBrutalismMode = useNeoBrutalismMode()
  const glassmorphismMode = useGlassmorphismMode()

  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi'
    setLanguage(newLang)
  }

  const getButtonClasses = () => {
    if (variant === 'settings') {
      if (neoBrutalismMode) {
        return "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] bg-white dark:bg-[#2a2a2a] text-[#1a1a1a] dark:text-[#FFFBEB] font-bold px-6 py-3"
      }
      if (glassmorphismMode) {
        return "bg-white/20 dark:bg-white/10 border border-white/40 dark:border-white/30 text-white backdrop-blur-[20px] hover:bg-white/30 dark:hover:bg-white/20 hover:scale-105 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[20px] px-6 py-3"
      }
      return "bg-white dark:bg-black text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-6 py-3"
    }
    
    // Default variant (for login page, etc.)
    if (neoBrutalismMode) {
      return "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] bg-white dark:bg-[#2a2a2a] text-[#1a1a1a] dark:text-[#FFFBEB] font-bold"
    }
    if (glassmorphismMode) {
      return "bg-white/20 dark:bg-white/10 border border-white/40 dark:border-white/30 text-white backdrop-blur-[20px] hover:bg-white/30 dark:hover:bg-white/20 hover:scale-105 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[20px]"
    }
    return "bg-white dark:bg-black text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
  }

  const getTextClasses = () => {
    if (neoBrutalismMode) {
      return "font-bold"
    }
    if (glassmorphismMode) {
      return "text-white drop-shadow-md"
    }
    return "text-gray-700 dark:text-gray-300"
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={variant === 'settings' ? 'default' : 'sm'}
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 transition-all",
        getButtonClasses()
      )}
      title={language === 'vi' ? t('settings.switchToEnglish') : t('settings.switchToVietnamese')}
    >
      <Languages className={cn("w-4 h-4", variant === 'settings' && "w-5 h-5")} />
      <span className={cn(
        variant === 'settings' ? "text-base font-semibold" : "text-sm font-medium",
        "uppercase",
        getTextClasses()
      )}>
        {language === 'vi' ? 'VI' : 'EN'}
      </span>
    </Button>
  )
}

