# Backend — Auth Rules

1. Passwords hashed with bcryptjs (10 salt rounds)
2. JWT tokens with configurable expiration (default 7d)
3. Token sent via Authorization: Bearer <token> header
4. authMiddleware extracts userId from token and adds to request
5. 401 response for missing/invalid tokens
6. Login returns { user, token, refreshToken }
7. Register creates user + initial stats document
8. Email is unique index — 409 on duplicate
