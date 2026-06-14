# Component Template

```typescript
// src/shared/components/ui/[ComponentName].tsx
import { type ReactNode } from 'react'
import { cn } from '@shared/lib/utils'

interface [ComponentName]Props {
  children?: ReactNode
  className?: string
  variant?: 'default' | 'primary'
  size?: 'sm' | 'md' | 'lg'
}

export function [ComponentName]({ children, className, variant = 'default', size = 'md' }: [ComponentName]Props) {
  return (
    <div className={cn('base-styles', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </div>
  )
}
```
