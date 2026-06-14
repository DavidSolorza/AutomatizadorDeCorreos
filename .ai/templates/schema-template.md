# Schema Template

```typescript
// server/src/models/[Model].ts
import mongoose, { Schema, Document } from 'mongoose'

export interface I[Model] extends Document {
  userId: string
  // fields...
  createdAt: Date
  updatedAt: Date
}

const [Model]Schema = new Schema<I[Model]>(
  {
    userId: { type: String, required: true, index: true },
    // field definitions...
  },
  { timestamps: true },
)

[Model]Schema.index({ userId: 1, createdAt: -1 })

export const [Model]Model = mongoose.model<I[Model]>('[Model]', [Model]Schema)
```
