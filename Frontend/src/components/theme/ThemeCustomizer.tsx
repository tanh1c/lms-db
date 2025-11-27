import { useThemeStore } from '@/store/themeStore'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Moon, Sun, Palette, Square, ZapOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNeoBrutalismButtonClasses, getNeoBrutalismInputClasses, getNeoBrutalismTextClasses } from '@/lib/utils/theme-utils'

const FONT_OPTIONS = [
  { value: "'Inter', system-ui, sans-serif", label: 'Inter' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'TheGoodMonolith', sans-serif", label: 'TheGoodMonolith' },
  { value: "'Pixeloid Sans', sans-serif", label: 'Pixeloid Sans' },
]

const COLOR_PRESETS = [
  { name: 'Blue', value: '222.2 47.4% 11.2%' },
  { name: 'Purple', value: '262.1 83.3% 57.8%' },
  { name: 'Green', value: '142.1 76.2% 36.3%' },
  { name: 'Orange', value: '24.6 95% 53.1%' },
  { name: 'Red', value: '0 72.2% 50.6%' },
  { name: 'Pink', value: '330 81% 60%' },
]

export default function ThemeCustomizer() {
  const { t } = useTranslation()
  const { primaryColor, fontFamily, darkMode, neoBrutalismMode, minimalMode, setPrimaryColor, setFontFamily, toggleDarkMode, setNeoBrutalismMode, setMinimalMode, resetTheme } = useThemeStore()
  const [showSuccess, setShowSuccess] = useState(false)
  const [tempFontFamily, setTempFontFamily] = useState(fontFamily)
  const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor)
  const [tempCustomColor, setTempCustomColor] = useState('#1e293b')
  const [tempDarkMode, setTempDarkMode] = useState(darkMode)
  const [tempNeoBrutalismMode, setTempNeoBrutalismMode] = useState(neoBrutalismMode)
  const [tempMinimalMode, setTempMinimalMode] = useState(minimalMode)

  useEffect(() => {
    // Initialize customColor from primaryColor
    const hex = hslToHex(primaryColor)
    setTempCustomColor(hex)
    setTempFontFamily(fontFamily)
    setTempPrimaryColor(primaryColor)
    setTempDarkMode(darkMode)
    setTempNeoBrutalismMode(neoBrutalismMode)
    setTempMinimalMode(minimalMode)
  }, [primaryColor, fontFamily, darkMode, neoBrutalismMode, minimalMode])

  const handleColorChange = (color: string) => {
    // Convert hex to HSL
    const hsl = hexToHsl(color)
    setTempPrimaryColor(hsl)
    setTempCustomColor(color)
  }

  const handlePresetColor = (hsl: string) => {
    setTempPrimaryColor(hsl)
    // Convert HSL back to hex for display
    const hex = hslToHex(hsl)
    setTempCustomColor(hex)
  }

  const handleFontChange = (font: string) => {
    setTempFontFamily(font)
  }

  const handleSave = () => {
    setPrimaryColor(tempPrimaryColor)
    setFontFamily(tempFontFamily)
    if (tempDarkMode !== darkMode) {
      toggleDarkMode()
    }
    setNeoBrutalismMode(tempNeoBrutalismMode)
    setMinimalMode(tempMinimalMode)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const hasChanges = () => {
    return tempPrimaryColor !== primaryColor || tempFontFamily !== fontFamily || tempDarkMode !== darkMode || tempNeoBrutalismMode !== neoBrutalismMode || tempMinimalMode !== minimalMode
  }

  return (
    <div className="space-y-8">
      {/* Dark Mode Toggle */}
      <div className="space-y-4">
        <Label className={cn(
          "text-sm font-medium text-[#211c37] dark:text-white mb-4 block",
          getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
        )}>
          {t('theme.interfaceMode')}
        </Label>
        <div className={cn(
          "flex items-center justify-between p-4 bg-[#f5f7f9] dark:bg-[#1a1a1a]",
          tempNeoBrutalismMode
            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
            : "rounded-xl border border-[#e7eae9] dark:border-[#333]"
        )}>
          <div className="flex items-center gap-3">
            {tempDarkMode ? (
              <Moon className="w-5 h-5 text-[#211c37] dark:text-white" />
            ) : (
              <Sun className="w-5 h-5 text-[#211c37] dark:text-white" />
            )}
            <span className={cn(
              "text-sm font-medium text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
            )}>
              {tempDarkMode ? t('theme.darkMode') : t('theme.lightMode')}
            </span>
          </div>
          <button
            onClick={() => setTempDarkMode(!tempDarkMode)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              tempDarkMode ? "bg-[#3bafa8]" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                tempDarkMode ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Neo-Brutalism Theme Toggle */}
      <div className="space-y-4">
        <Label className={cn(
          "text-sm font-medium text-[#211c37] dark:text-white mb-4 block",
          getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
        )}>
          {t('theme.styleTheme')}
        </Label>
        <div className={cn(
          "flex items-center justify-between p-4 bg-[#f5f7f9] dark:bg-[#1a1a1a]",
          tempNeoBrutalismMode
            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
            : "rounded-xl border border-[#e7eae9] dark:border-[#333]"
        )}>
          <div className="flex items-center gap-3">
            {tempNeoBrutalismMode ? (
              <Square className="w-5 h-5 text-[#211c37] dark:text-white" />
            ) : (
              <Palette className="w-5 h-5 text-[#211c37] dark:text-white" />
            )}
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-medium text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
              )}>
                {tempNeoBrutalismMode ? t('theme.neoBrutalism') : t('theme.normal')}
              </span>
              <span className={cn(
                "text-xs text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'body')
              )}>
                {tempNeoBrutalismMode ? t('theme.boldBorders') : t('theme.smoothRounded')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setTempNeoBrutalismMode(!tempNeoBrutalismMode)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              tempNeoBrutalismMode ? "bg-[#3bafa8]" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                tempNeoBrutalismMode ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Minimal Mode Toggle */}
      <div className="space-y-4">
        <Label className={cn(
          "text-sm font-medium text-[#211c37] dark:text-white mb-4 block",
          getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
        )}>
          {t('theme.performance')}
        </Label>
        <div className={cn(
          "flex items-center justify-between p-4 bg-[#f5f7f9] dark:bg-[#1a1a1a]",
          tempNeoBrutalismMode
            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
            : "rounded-xl border border-[#e7eae9] dark:border-[#333]"
        )}>
          <div className="flex items-center gap-3">
            <ZapOff className="w-5 h-5 text-[#211c37] dark:text-white" />
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-medium text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
              )}>
                {tempMinimalMode ? t('theme.minimalMode') : t('theme.animationsEnabled')}
              </span>
              <span className={cn(
                "text-xs text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'body')
              )}>
                {tempMinimalMode ? t('theme.disableAllAnimations') : t('theme.enableAllAnimations')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setTempMinimalMode(!tempMinimalMode)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              tempMinimalMode ? "bg-[#3bafa8]" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                tempMinimalMode ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Color Customization */}
      <div className="space-y-4">
        <div>
          <Label className={cn(
            "text-sm font-medium text-[#211c37] dark:text-white mb-4 block",
            getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
          )}>
            {t('theme.primaryColor')}
          </Label>
          
          {/* Color Presets */}
          <div className="grid grid-cols-6 gap-3 mb-4">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetColor(preset.value)}
                className={cn(
                  "h-12 border-2 transition-all",
                  tempNeoBrutalismMode
                    ? "border-4 rounded-none"
                    : "rounded-xl border-2",
                  tempPrimaryColor === preset.value
                    ? tempNeoBrutalismMode
                      ? "border-[#1a1a1a] dark:border-[#FFFBEB] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                      : "border-[#3bafa8] ring-2 ring-[#3bafa8] ring-offset-2"
                    : tempNeoBrutalismMode
                      ? "border-[#1a1a1a] dark:border-[#FFFBEB] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                      : "border-[#e7eae9] hover:border-[#3bafa8]"
                )}
                style={{
                  backgroundColor: hslToHex(preset.value),
                }}
                title={preset.name}
              />
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={tempCustomColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className={cn(
                "h-12 w-20 cursor-pointer",
                tempNeoBrutalismMode
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-xl border border-[#e7eae9]"
              )}
            />
            <Input
              type="text"
              value={tempCustomColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className={cn(
                "flex-1 h-12",
                tempNeoBrutalismMode
                  ? getNeoBrutalismInputClasses(tempNeoBrutalismMode)
                  : "border-[#e7eae9] rounded-xl"
              )}
              placeholder="#1e293b"
            />
          </div>
        </div>
      </div>

      {/* Font Customization */}
      <div className="space-y-4">
        <Label className={cn(
          "text-sm font-medium text-[#211c37] dark:text-white mb-4 block",
          getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')
        )}>
          {t('theme.font')}
        </Label>
        <select
          value={tempFontFamily}
          onChange={(e) => handleFontChange(e.target.value)}
          className={cn(
            "w-full px-4 py-3 border bg-white dark:bg-[#1a1a1a] h-12 text-sm font-medium text-[#211c37] dark:text-white",
            tempNeoBrutalismMode
              ? getNeoBrutalismInputClasses(tempNeoBrutalismMode, "appearance-none cursor-pointer")
              : "border-[#e7eae9] dark:border-[#333] rounded-xl focus:ring-2 focus:ring-[#3bafa8] focus:border-transparent"
          )}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        
        {/* Font Preview */}
        <div className={cn(
          "mt-4 p-6 bg-[#f5f7f9] dark:bg-[#1a1a1a]",
          tempNeoBrutalismMode
            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
            : "rounded-xl border border-[#e7eae9] dark:border-[#333]"
        )}>
          <p className={cn(
            "text-base text-[#211c37] dark:text-white",
            getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'body')
          )} style={{ fontFamily: tempFontFamily }}>
            {t('theme.fontPreview')}: {t('theme.fontPreviewText')}
          </p>
        </div>
      </div>

      {/* Save and Reset Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges()}
          className={cn(
            "flex-1 h-12 transition-all",
            tempNeoBrutalismMode
              ? getNeoBrutalismButtonClasses(tempNeoBrutalismMode, 'primary', "bg-black dark:bg-white text-white dark:text-black")
              : "bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {showSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              <span className={getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')}>{t('theme.saved')}</span>
            </>
          ) : (
            <span className={getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')}>{t('theme.saveChanges')}</span>
          )}
        </Button>
        <Button
          onClick={resetTheme}
          variant="outline"
          className={cn(
            "flex-1 h-12 text-[#211c37] dark:text-white transition-all",
            tempNeoBrutalismMode
              ? getNeoBrutalismButtonClasses(tempNeoBrutalismMode, 'outline', "border-[#1a1a1a] dark:border-[#FFFBEB] hover:bg-[#f5f7f9] dark:hover:bg-[#2a2a2a]")
              : "border-[#e7eae9] dark:border-[#333] rounded-xl hover:bg-[#f5f7f9] dark:hover:bg-[#2a2a2a]"
          )}
        >
          <span className={getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')}>{t('theme.resetDefault')}</span>
        </Button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className={cn(
          "mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm flex items-center gap-2",
          tempNeoBrutalismMode
            ? "border-4 border-green-600 dark:border-green-400 rounded-none shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] dark:shadow-[4px_4px_0px_0px_rgba(74,222,128,1)]"
            : "rounded-xl"
        )}>
          <Check className="w-4 h-4" />
          <span className={getNeoBrutalismTextClasses(tempNeoBrutalismMode, 'bold')}>{t('theme.saveSuccess')}</span>
        </div>
      )}
    </div>
  )
}

// Helper functions
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((val, i) => {
    if (i === 0) return parseFloat(val) / 360
    return parseFloat(val) / 100
  })

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

