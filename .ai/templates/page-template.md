# Page Template

```typescript
// src/features/[feature]/pages/[Feature]Page.tsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { [icon] } from 'lucide-react'
import { use[Store]Store } from '@core/store'
import { Card } from '@shared/components/ui/Card'
import { Button } from '@shared/components/ui/Button'
import { EmptyState } from '@shared/components/ui/EmptyState'
import { LoadingState } from '@shared/components/ui/LoadingState'
import { useToastStore } from '@shared/store/toastStore'
import { cn } from '@shared/lib/utils'

export function [Feature]Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    try {
      // Load data
      setLoading(false)
    } catch (err) {
      setError('Error al cargar datos')
      setLoading(false)
    }
  }, [])

  if (loading) return <LoadingState />
  if (error) return <EmptyState icon={...} title={error} />
  if (items.length === 0) return <EmptyState icon={...} title="Sin datos" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">[Title]</h1>
    </div>
  )
}
```
