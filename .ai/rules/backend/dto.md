# DTO Rules

1. Request bodies are validated before processing
2. Response bodies exclude sensitive fields (password)
3. Use consistent { error: string } for errors
4. Use camelCase in JSON responses (matching TypeScript conventions)
