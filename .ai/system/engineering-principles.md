# Engineering Principles

1. **Vertical Slice Architecture**: Features are self-contained with their own pages, components, services
2. **One-Way Dependencies**: core/ -> shared/ -> features/
3. **TypeScript Strict**: Full type safety, no `any` without justification
4. **Offline-First**: All data works offline via localStorage; backend is optional
5. **Test Coverage**: Critical paths must have tests (services, stores, UI components)
6. **No Dead Code**: Prune unused imports, components, and files aggressively
7. **Consistent Patterns**: Follow existing conventions for naming, imports, and file structure
8. **Performance Aware**: Lazy load routes, memoize when needed, minimize bundle
