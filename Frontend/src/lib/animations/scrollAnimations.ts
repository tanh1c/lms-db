import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { shouldRunAnimation } from '@/lib/utils/animation-utils'

export const scrollAnimations = {
  init: () => {
    if (shouldRunAnimation()) {
      gsap.registerPlugin(ScrollTrigger)
    }
  },

  fadeInOnScroll: (selector: string) => {
    if (!shouldRunAnimation()) {
      // In minimal mode, just show elements immediately
      gsap.utils.toArray(selector).forEach((element: any) => {
        gsap.set(element, { opacity: 1, y: 0 })
      })
      return
    }
    
    gsap.utils.toArray(selector).forEach((element: any) => {
      gsap.from(element, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    })
  },

  slideInOnScroll: (selector: string, direction: 'left' | 'right' = 'left') => {
    if (!shouldRunAnimation()) {
      // In minimal mode, just show elements immediately
      gsap.utils.toArray(selector).forEach((element: any) => {
        gsap.set(element, { opacity: 1, x: 0 })
      })
      return
    }
    
    gsap.utils.toArray(selector).forEach((element: any) => {
      gsap.from(element, {
        x: direction === 'left' ? -100 : 100,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    })
  },

  batchReveal: (selector: string) => {
    if (!shouldRunAnimation()) {
      // In minimal mode, just show elements immediately
      gsap.utils.toArray(selector).forEach((element: any) => {
        gsap.set(element, { opacity: 1, y: 0 })
      })
      return
    }
    
    ScrollTrigger.batch(selector, {
      onEnter: (elements) => {
        gsap.from(elements, {
          y: 50,
          opacity: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power2.out',
        })
      },
      start: 'top 80%',
    })
  },
}

