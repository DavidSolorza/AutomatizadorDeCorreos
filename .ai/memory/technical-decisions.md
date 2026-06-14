# Technical Decisions

## ADR-001: Vertical Slice Architecture
- Context: Need to scale features without cross-contamination
- Decision: Organize by feature (auth, learning-path, profile, projects) with shared/ and core/ layers
- Consequences: Clear boundaries, easy to extract features later, consistent patterns

## ADR-002: Zustand over Redux/Context
- Context: Need global state without boilerplate
- Decision: Use Zustand with persist middleware for auth, stats, UI preferences, paths
- Consequences: Minimal code, built-in persistence, TypeScript-native

## ADR-003: localStorage as Primary Store (offline-first)
- Context: No backend yet, need persistence
- Decision: All data persists via localStorage through services
- Consequences: Offline-capable, no sync, migrated via DbAdapter pattern later

## ADR-004: DbAdapter Pattern for MongoDB Migration
- Context: Future backend migration should not require rewrites
- Decision: DbAdapter interface with LocalStorageAdapter (current) and ApiAdapter (future)
- Consequences: Services can switch adapters transparently

## ADR-005: No Emojis in UI or AI
- Context: Professional, minimal aesthetic inspired by Linear/Vercel
- Decision: All emoji usage replaced with CSS-styled initial-letter boxes; AI instructed to never use emojis
- Consequences: Consistent professional look, requires intentional alternative styling

## ADR-006: Tech-Only Focus
- Context: Users wanted a focused learning platform
- Decision: Remove all non-tech categories, topics, and resources
- Consequences: Smaller codebase, clearer positioning, no fallback for non-tech subjects

## ADR-007: Prerequisites-First AI Approach
- Context: Users start learning without proper foundation
- Decision: AI must identify prerequisites before generating the learning plan
- Consequences: More effective learning paths, better user outcomes

## ADR-008: Pre-Path Survey
- Context: One-size-fits-all paths are ineffective
- Decision: Before generating a path, AI asks about time, method, level, project preference
- Consequences: Fully personalized paths, higher engagement
