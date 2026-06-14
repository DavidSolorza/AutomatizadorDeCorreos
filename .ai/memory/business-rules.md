# Business Rules

## Domain
- EXCLUSIVELY programming and technology topics
- No generic topics (skateboarding, yoga, music, cooking, etc.)

## Learning Paths
- AI generates paths with 4 stages, 5 topics each
- Topics include: name, content (mini-class), difficulty, resources
- Resources include real documentation URLs when available
- Path generation requires a pre-survey: time, method, level, project type
- Survey data is passed to AI for full personalization

## AI Behavior
- Prerequisites first: before launching into the learning plan, AI identifies what the user needs to know first
- No video/YouTube URLs in responses
- Use expert/author names instead: "Busca a [nombre]"
- No emojis in any response
- Three analytical query types: "What should I learn next?", "Am I ready for a project?", "What am I missing for my goal?"
- System prompt defines 12 tech domains + pedagogical capabilities + response modes

## Authentication
- Email/password registration
- Demo user: demo@pathforge.ai / 123456
- All data in localStorage (offline-first)

## UI Rules
- Minimal, white space, soft shadows
- Inspired by Linear, Vercel, Notion
- No emojis anywhere in UI or AI output
- Dark mode toggle in sidebar
- Lazy loading, Suspense, ErrorBoundary, skeletons, empty states, toast notifications
