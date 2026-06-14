# Backend Rules

1. All routes follow REST conventions: GET, POST, PUT, DELETE
2. Use authMiddleware on all protected routes
3. Validate request body with manual checks or Zod (when added)
4. Return consistent error format: { error: string }
5. Never expose internal errors to the client
6. Log errors server-side with context
7. Keep route handlers thin; business logic in services (future)
