# Auth Rules

1. Passwords hashed with bcryptjs (10 rounds)
2. JWT tokens with 7-day expiration
3. Token sent via Authorization: Bearer header
4. AuthMiddleware checks token on every protected route
5. Login returns { user, token, refreshToken }
6. Password never returned in any response
