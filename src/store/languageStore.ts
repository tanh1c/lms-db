import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import i18n from '@/i18n/config'

type Language = 'vi' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: (localStorage.getItem('i18nextLng') as Language) || 'en',
      setLanguage: (lang: Language) => {
        i18n.changeLanguage(lang)
        set({ language: lang })
      },
      toggleLanguage: () => {
        set((state) => {
          const newLang = state.language === 'vi' ? 'en' : 'vi'
          i18n.changeLanguage(newLang)
          return { language: newLang }
        })
      },
    }),
    {
      name: 'lms-language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

