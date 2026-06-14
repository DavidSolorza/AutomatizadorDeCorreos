# Backend — Error Handling

1. All route handlers wrapped in try/catch
2. Known errors: return specific status + { error: "message" }
3. Unknown errors: log to console, return 500 { error: "Error interno del servidor" }
4. MongoDB connection errors handled in db.ts with process.exit(1)
5. Socket.io errors handled per-connection
6. Never expose stack traces in production
