# Architect Architecture Rules

1. Follow Vertical Slice Architecture: core/ -> shared/ -> features/
2. Features are independent slices with their own pages, components, services, and stores
3. Shared code belongs in shared/ (UI components, utilities, types, services)
4. Core/ is for config, routing, and global stores only
5. No circular dependencies between features
6. Prepare for MongoDB migration via DbAdapter pattern
7. Lazy load all route-level components
