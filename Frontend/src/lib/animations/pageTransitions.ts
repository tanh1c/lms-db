import { gsap } from 'gsap'
import { shouldRunAnimation } from '@/lib/utils/animation-utils'

export const pageTransition = {
  fadeIn: (element: HTMLElement) => {
    if (!shouldRunAnimation()) {
      // In minimal mode, just show element immediately
      gsap.set(element, { opacity: 1 })
      return { kill: () => {} } as gsap.core.Tween
    }
    
    return gsap.from(element, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  },

  slideUp: (element: HTMLElement) => {
    if (!shouldRunAnimation()) {
      // In minimal mode, just show element immediately
      gsap.set(element, { opacity: 1, y: 0 })
      return { kill: () => {} } as gsap.core.Tween
    }
    
    return gsap.from(element, {
      y: 50,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    })
  },

  staggerChildren: (_container: HTMLElement, children: HTMLElement[]) => {
    if (!shouldRunAnimation()) {
      // In minimal mode, just show elements immediately
      children.forEach((child) => {
        gsap.set(child, { opacity: 1, y: 0 })
      })
      return { kill: () => {} } as gsap.core.Tween
    }
    
    return gsap.from(children, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
    })
  },
}

