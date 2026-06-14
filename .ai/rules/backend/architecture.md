# Architecture Rules

1. Express router handles HTTP concerns
2. Mongoose models handle data concerns
3. Middleware handles cross-cutting concerns (auth, logging)
4. Controllers are thin (future: business logic in services)
5. Async route handlers must catch errors
