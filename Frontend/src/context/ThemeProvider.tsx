import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { primaryColor, fontFamily, darkMode, minimalMode } = useThemeStore()

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
    
    // Apply minimal mode (disable animations)
    if (minimalMode) {
      root.classList.add('minimal-mode')
    } else {
      root.classList.remove('minimal-mode')
    }
  }, [primaryColor, fontFamily, darkMode, minimalMode])

  return <>{children}</>
}

