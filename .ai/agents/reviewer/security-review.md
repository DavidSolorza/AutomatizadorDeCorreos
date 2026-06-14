# Reviewer — Security Review

1. No API keys in code or localStorage exposed
2. JWT tokens handled properly (Bearer auth)
3. Input is validated before database operations
4. No eval, innerHTML, or dangerous React props like dangerouslySetInnerHTML
5. CORS configured properly
6. Passwords never logged or returned in responses
