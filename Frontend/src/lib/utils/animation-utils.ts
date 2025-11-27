import { useThemeStore } from '@/store/themeStore'

/**
 * Check if minimal mode is enabled (animations disabled)
 */
export function useMinimalMode(): boolean {
  return useThemeStore((state) => state.minimalMode)
}

/**
 * Get minimal mode state (for use outside React components)
 */
export function getMinimalMode(): boolean {
  return useThemeStore.getState().minimalMode
}

/**
 * Wrapper for GSAP animations that respects minimal mode
 * Returns immediately if minimal mode is enabled
 */
export function withMinimalModeCheck<T extends (...args: any[]) => any>(
  animationFn: T
): T {
  return ((...args: Parameters<T>) => {
    if (getMinimalMode()) {
      return null // Don't run animation in minimal mode
    }
    return animationFn(...args)
  }) as T
}

/**
 * Check if animation should run based on minimal mode
 */
export function shouldRunAnimation(): boolean {
  return !getMinimalMode()
}

