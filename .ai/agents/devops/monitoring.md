# DevOps — Monitoring

- Console logging only in development
- In production: structured logging (JSON) to stdout
- Health endpoint: GET /api/health returns { status: "ok", timestamp }
- MongoDB connection events logged (connected, disconnected, error)
- Socket.io connection/disconnection logged
- (Future) Sentry or similar for error tracking
