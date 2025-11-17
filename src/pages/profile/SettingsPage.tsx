import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeCustomizer from '@/components/theme/ThemeCustomizer'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { cn } from '@/lib/utils'
import { useNeoBrutalismMode, getNeoBrutalismCardClasses, getNeoBrutalismTextClasses } from '@/lib/utils/theme-utils'
import { Globe } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()
  const neoBrutalismMode = useNeoBrutalismMode()

  return (
    <DashboardLayout 
      title={t('settings.title')} 
      subtitle={t('settings.subtitle')}
    >
      <div className="space-y-6">
        {/* Language Settings */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>{t('settings.language')}</CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('settings.languageDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('settings.selectLanguage')}
                </p>
                <p className={cn(
                  "text-xs text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('settings.languageHint')}
                </p>
              </div>
              <LanguageSwitcher variant="settings" />
            </div>
          </CardContent>
        </Card>

        {/* Theme Customization */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <CardTitle className={cn(
              "text-xl text-[#1f1d39] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
            )}>{t('settings.theme')}</CardTitle>
            <CardDescription className={cn(
              "text-[#85878d] dark:text-gray-400",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {t('settings.themeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeCustomizer />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

