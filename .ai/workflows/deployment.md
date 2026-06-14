# Deployment Workflow

1. Run full build: pnpm build
2. Run all tests: pnpm test
3. Verify no TypeScript errors
4. Build Docker image
5. Push to registry
6. Deploy to target (Vercel/Railway)
7. Verify health endpoint
8. Monitor for errors
