import { gsap } from 'gsap'

export const microInteractions = {
  hoverScale: (element: HTMLElement) => {
    const hover = gsap.to(element, {
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out',
      paused: true,
    })

    element.addEventListener('mouseenter', () => hover.play())
    element.addEventListener('mouseleave', () => hover.reverse())

    return () => {
      element.removeEventListener('mouseenter', () => hover.play())
      element.removeEventListener('mouseleave', () => hover.reverse())
    }
  },

  clickRipple: (element: HTMLElement) => {
    element.addEventListener('click', (e) => {
      const ripple = document.createElement('div')
      ripple.style.position = 'absolute'
      ripple.style.borderRadius = '50%'
      ripple.style.background = 'rgba(255, 255, 255, 0.6)'
      ripple.style.width = '20px'
      ripple.style.height = '20px'
      ripple.style.left = `${e.offsetX - 10}px`
      ripple.style.top = `${e.offsetY - 10}px`
      ripple.style.pointerEvents = 'none'

      element.style.position = 'relative'
      element.appendChild(ripple)

      gsap.to(ripple, {
        scale: 10,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      })
    })
  },

  buttonPress: (element: HTMLElement) => {
    element.addEventListener('mousedown', () => {
      gsap.to(element, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.out',
      })
    })

    element.addEventListener('mouseup', () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.1,
        ease: 'power2.out',
      })
    })
  },
}

