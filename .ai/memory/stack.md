# Stack

## Frontend
- React 19 + TypeScript 6
- Vite 8 (dev/build)
- pnpm (package manager)
- TailwindCSS v4 (styling)
- Zustand 5 (state management, persisted)
- Framer Motion (animations)
- Lucide React (icons)
- clsx + class-variance-authority (class utilities)
- Axios (HTTP client)
- React Router DOM v7 (routing)
- React Hook Form + Zod (forms)

## Backend (planned migration)
- Express + TypeScript
- MongoDB + Mongoose
- JWT (auth)
- Socket.io (real-time sync)
- bcryptjs (password hashing)

## Architecture
- Vertical Slice: core/ -> shared/ -> features/
- All data persists via localStorage (layered: components -> services -> LocalStorageService)
- Prepared for MongoDB migration (DbAdapter interface)

## Testing
- Vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- 12 test files, 83 tests
