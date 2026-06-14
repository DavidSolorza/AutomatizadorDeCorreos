# API Template

```typescript
// server/src/routes/[resource].ts
import { Router, Response } from 'express'
import { [Model]Model } from '../models/[Model]'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const items = await [Model]Model.find({ userId: req.userId })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
```
