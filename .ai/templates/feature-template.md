# Feature Template

```typescript
// src/features/[feature-name]/pages/[FeatureName]Page.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { [icon] } from 'lucide-react'
import { use[Store]Store } from '@core/store'
import { Card } from '@shared/components/ui/Card'
import { Button } from '@shared/components/ui/Button'
import { EmptyState } from '@shared/components/ui/EmptyState'
import { cn } from '@shared/lib/utils'

export function [FeatureName]Page() {
  const [loading, setLoading] = useState(false)
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">[Title]</h1>
    </div>
  )
}
```
