# Logging Rules

1. Log all errors with context (endpoint, userId, error message)
2. Use console.error for server-side errors (future: structured logger)
3. Use console.log only during development
4. No sensitive data in logs (passwords, tokens)
5. Log request method and path for debugging
