import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

/**
 * Hook to check if neo-brutalism mode is enabled
 */
export const useNeoBrutalismMode = () => {
  const neoBrutalismMode = useThemeStore((state) => state.neoBrutalismMode)
  return neoBrutalismMode
}

/**
 * Generate neo-brutalism classes for cards
 */
export const getNeoBrutalismCardClasses = (neoBrutalismMode: boolean, additionalClasses?: string) => {
  if (!neoBrutalismMode) {
    return cn("border border-[#e5e7e7] dark:border-[#333] rounded-xl bg-white dark:bg-[#1a1a1a]", additionalClasses)
  }
  return cn(
    "neo-brutalism-card border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none",
    "shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]",
    "bg-white dark:bg-[#2a2a2a]",
    additionalClasses
  )
}

/**
 * Generate neo-brutalism classes for buttons
 */
export const getNeoBrutalismButtonClasses = (neoBrutalismMode: boolean, variant: 'primary' | 'secondary' | 'outline' = 'primary', additionalClasses?: string) => {
  if (!neoBrutalismMode) {
    return additionalClasses
  }
  
  const baseClasses = "neo-brutalism-button rounded-none border-4 font-bold transition-all hover:translate-x-1 hover:translate-y-1 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
  
  if (variant === 'primary') {
    return cn(
      baseClasses,
      "bg-[#1a1a1a] dark:bg-[#FFFBEB] text-white dark:text-[#1a1a1a]",
      "border-[#1a1a1a] dark:border-[#FFFBEB]",
      "shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]",
      "hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
      additionalClasses
    )
  }
  
  if (variant === 'outline') {
    return cn(
      baseClasses,
      "bg-white dark:bg-[#1a1a1a] text-[#1a1a1a] dark:text-[#FFFBEB]",
      "border-[#1a1a1a] dark:border-[#FFFBEB]",
      "shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
      "hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]",
      additionalClasses
    )
  }
  
  return additionalClasses
}

/**
 * Generate neo-brutalism classes for inputs
 */
export const getNeoBrutalismInputClasses = (neoBrutalismMode: boolean, additionalClasses?: string) => {
  if (!neoBrutalismMode) {
    return cn("border border-[#e5e7e7] dark:border-[#333] rounded-xl", additionalClasses)
  }
  return cn(
    "neo-brutalism-input border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none",
    "bg-white dark:bg-[#1a1a1a] text-[#1a1a1a] dark:text-[#FFFBEB]",
    "focus:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
    "font-semibold",
    additionalClasses
  )
}

/**
 * Generate neo-brutalism classes for stat cards
 */
export const getNeoBrutalismStatCardClasses = (neoBrutalismMode: boolean, additionalClasses?: string) => {
  if (!neoBrutalismMode) {
    return cn("border border-[#e5e7e7] dark:border-[#333] rounded-xl bg-white dark:bg-[#1a1a1a]", additionalClasses)
  }
  return cn(
    "neo-brutalism-card border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none",
    "shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,251,235,1)]",
    "bg-white dark:bg-[#2a2a2a]",
    additionalClasses
  )
}

/**
 * Generate neo-brutalism classes for course cards
 */
export const getNeoBrutalismCourseCardClasses = (neoBrutalismMode: boolean, additionalClasses?: string) => {
  if (!neoBrutalismMode) {
    return cn("border border-[#e5e7e7] dark:border-[#333] rounded-xl bg-white dark:bg-[#1a1a1a]", additionalClasses)
  }
  return cn(
    "neo-brutalism-card border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none",
    "shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,251,235,1)]",
    "bg-white dark:bg-[#2a2a2a] hover:translate-x-1 hover:translate-y-1",
    "hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
    "transition-all cursor-pointer",
    additionalClasses
  )
}

/**
 * Generate neo-brutalism text classes
 */
export const getNeoBrutalismTextClasses = (neoBrutalismMode: boolean, variant: 'heading' | 'body' | 'bold' = 'body') => {
  if (!neoBrutalismMode) {
    return ""
  }
  
  if (variant === 'heading') {
    return "neo-brutalism-text font-bold"
  }
  
  if (variant === 'bold') {
    return "font-bold"
  }
  
  return "font-semibold"
}

/**
 * Hook to check if glassmorphism mode is enabled
 */
export const useGlassmorphismMode = () => {
  const glassmorphismMode = useThemeStore((state) => state.glassmorphismMode)
  return glassmorphismMode
}

/**
 * Generate glassmorphism classes for cards
 */
export const getGlassmorphismCardClasses = (glassmorphismMode: boolean, additionalClasses?: string) => {
  if (!glassmorphismMode) {
    return cn("border border-[#e5e7e7] dark:border-[#333] rounded-xl", additionalClasses)
  }
  return cn(
    "glass-card",
    "bg-white/15 dark:bg-black/15",
    "backdrop-blur-[20px]",
    "border border-white/30 dark:border-white/20",
    "rounded-[20px]",
    "shadow-[0_8px_32px_rgba(0,0,0,0.1)]",
    "relative overflow-hidden",
    additionalClasses
  )
}

/**
 * Generate glassmorphism classes for buttons
 */
export const getGlassmorphismButtonClasses = (glassmorphismMode: boolean, variant: 'primary' | 'secondary' | 'outline' = 'primary', additionalClasses?: string) => {
  if (!glassmorphismMode) {
    return additionalClasses
  }
  
  const baseClasses = "glass-button rounded-[20px] border backdrop-blur-[20px] transition-all hover:scale-105"
  
  if (variant === 'primary') {
    return cn(
      baseClasses,
      "bg-white/20 dark:bg-white/10",
      "border-white/40 dark:border-white/30",
      "text-white dark:text-white",
      "shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
      "hover:bg-white/30 dark:hover:bg-white/20",
      "hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]",
      additionalClasses
    )
  }
  
  return additionalClasses
}

/**
 * Generate glassmorphism classes for inputs
 */
export const getGlassmorphismInputClasses = (glassmorphismMode: boolean, additionalClasses?: string) => {
  if (!glassmorphismMode) {
    return cn("border border-[#e5e7e7] dark:border-[#333] rounded-xl", additionalClasses)
  }
  return cn(
    "glass-input",
    "bg-white/10 dark:bg-black/10",
    "backdrop-blur-[20px]",
    "border border-white/30 dark:border-white/20",
    "rounded-[20px]",
    "text-white dark:text-white",
    "placeholder:text-white/60 dark:placeholder:text-white/40",
    "focus:bg-white/20 dark:focus:bg-black/20",
    "focus:border-white/50 dark:focus:border-white/40",
    "focus:shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
    additionalClasses
  )
}

