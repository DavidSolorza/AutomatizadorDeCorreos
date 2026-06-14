# DevOps — Deployment

1. Frontend: `pnpm build` -> deploy dist/ to Vercel/Netlify
2. Backend: `cd server && pnpm build` -> deploy dist/ to Railway/Render
3. MongoDB: Atlas M0 free tier for dev, M10+ for prod
4. Environment variables: set in deployment platform UI
5. No .env files in production — use platform secrets
