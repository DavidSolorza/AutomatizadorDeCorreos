# Performance Rules

1. Lazy load all route pages
2. Use React.memo only with clear performance metrics
3. Zustand selectors: subscribe to the minimum required state
4. Avoid inline function creation in render where possible
5. Use useCallback for stable function references
6. Use useRef for mutable values that should not trigger re-renders
