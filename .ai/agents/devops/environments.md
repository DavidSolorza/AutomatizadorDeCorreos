# DevOps — Environments

- **Development**: localhost:5173 (Vite) + localhost:3000 (Express) + local MongoDB
- **Staging**: deploy from feature branch to staging subdomain
- **Production**: deploy from main branch to production domain
- All environments use different MongoDB databases
- Environment variables: VITE_API_URL, MONGODB_URI, JWT_SECRET, CORS_ORIGIN
