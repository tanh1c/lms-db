import { gsap } from 'gsap'

export const pageTransition = {
  fadeIn: (element: HTMLElement) => {
    return gsap.from(element, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  },

  slideUp: (element: HTMLElement) => {
    return gsap.from(element, {
      y: 50,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    })
  },

  staggerChildren: (_container: HTMLElement, children: HTMLElement[]) => {
    return gsap.from(children, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
    })
  },
}

