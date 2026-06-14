# Reviewer — Rejection Rules

Reject if:
1. Build fails (tsc -b || vite build)
2. Tests fail (vitest run)
3. Any `any` type without strong justification
4. Circular imports detected
5. Console.log in production code
6. Hardcoded secrets or API keys
7. Emojis in UI strings or AI responses
8. Missing error handling on async operations
