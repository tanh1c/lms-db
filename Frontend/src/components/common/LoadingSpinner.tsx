import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import '@/lib/animations/gsap-setup'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const spinnerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (spinnerRef.current) {
      gsap.to(spinnerRef.current, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: 'none',
      })
    }
  }, { scope: spinnerRef })

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        ref={spinnerRef}
        className={`${sizeClasses[size]} border-4 border-primary border-t-transparent rounded-full`}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

