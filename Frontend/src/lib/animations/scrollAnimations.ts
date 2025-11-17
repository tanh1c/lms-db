import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const scrollAnimations = {
  init: () => {
    gsap.registerPlugin(ScrollTrigger)
  },

  fadeInOnScroll: (selector: string) => {
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

