import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { primaryColor, fontFamily, darkMode } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--theme-primary', primaryColor)
    root.style.setProperty('--theme-font-family', fontFamily)
    root.style.setProperty('--primary', primaryColor)
    
    // Apply dark mode
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [primaryColor, fontFamily, darkMode])

  return <>{children}</>
}

