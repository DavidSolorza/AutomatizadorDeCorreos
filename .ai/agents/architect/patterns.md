# Architect Patterns

1. **Service Layer**: All data operations go through services (PathStorageService, UserStorageService)
2. **Store Layer**: Zustand stores for global state with persist middleware
3. **Component Pattern**: UI components in shared/components/ui/, page components in features/ */pages/
4. **Adapter Pattern**: DbAdapter interface for storage abstraction (localStorage vs MongoDB)
5. **Factory Pattern**: Service methods are static/exported functions, not class instances
