import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-muted-foreground mb-4">{description}</p>}
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  )
}

