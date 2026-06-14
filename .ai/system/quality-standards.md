# Quality Standards

## Code Quality
- Zero TypeScript errors in build (`tsc -b`)
- Zero ESLint warnings
- All tests pass before merge
- No `console.log` in production code
- No `TODO` comments in committed code

## UI Quality
- No emojis in UI or AI output
- Consistent spacing (TailwindCSS v4 scale)
- Responsive: mobile -> tablet -> desktop
- Loading states (skeletons/spinners) for all async operations
- Empty states for all lists
- Error boundaries for all route segments
- Dark mode support

## Performance
- Lazy load all route pages
- No unnecessary re-renders (use Zustand selectors wisely)
- Bundle size monitored

## Testing
- Vitest for unit and integration tests
- @testing-library/react for component tests
- Minimum: service layer tested, store layer tested, critical UI tested
