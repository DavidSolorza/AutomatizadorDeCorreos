# Backend — Security

1. No secrets in code — all via environment variables
2. CORS configured to allow only frontend origin
3. Passwords never returned in API responses
4. Rate limiting on auth endpoints (to be implemented)
5. MongoDB injection prevention via Mongoose (built-in)
6. JWT secret minimum 32 characters in production
