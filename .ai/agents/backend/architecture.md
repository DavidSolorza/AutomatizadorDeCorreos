# Backend — Architecture

- Routes directory: one file per resource (auth, paths, projects, etc.)
- Models directory: Mongoose schemas matching frontend types
- Middleware: auth, error handler, rate limiter
- Server entry point (index.ts): connect DB, mount routes, start HTTP + WebSocket
- Separation: route handlers contain minimal logic, delegate to models
- Socket.io for real-time notifications on data changes
