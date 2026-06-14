# Current Architecture

## Directory Structure
```
src/
  core/          # Global config, routes, stores (Zustand)
  shared/        # Types, utilities, UI components, layouts, services
  features/      # Feature slices (auth, learning-path, recommendations, profile, projects)
```

## Layer Rules
- core/ -> shared/ -> features/ (one-way dependency)
- features/ can import from shared/ and core/
- shared/ can import from core/ only
- core/ imports nothing from the project

## Data Flow
Components -> Services (PathStorageService, UserStorageService) -> LocalStorageService
Components -> Stores (usePathStore, useAuthStore, useStatsStore) -> localStorage (via persist)

## Key Files
- `src/features/recommendations/services/AiService.ts` — Gemini AI integration + fallback system
- `src/features/recommendations/services/curatedResources.ts` — Curated tech-only resources
- `src/features/recommendations/pages/AIAssistantPage.tsx` — Chat + generator modes with survey
- `src/features/learning-path/pages/LearningPathPage.tsx` — Path display with topic content
- `src/features/learning-path/pages/DashboardPage.tsx` — Stats dashboard
- `src/shared/services/LocalStorageService.ts` — localStorage abstraction
- `src/shared/services/DbAdapter.ts` — Interface for future MongoDB migration
- `src/shared/services/ApiAdapter.ts` — REST API adapter with localStorage fallback
- `src/core/config/index.ts` — Central config (API URL, Gemini key, etc.)
- `src/core/store/index.ts` — All Zustand stores
- `src/shared/types/index.ts` — Domain types (User, Topic, Stage, LearningPath, etc.)
