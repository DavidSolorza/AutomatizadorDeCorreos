# Architect Boundaries

1. core/ knows nothing about features/
2. shared/ knows nothing about features/
3. features/ can import from shared/ and core/
4. No feature should import from another feature directly
5. Cross-feature communication goes through core/ stores or shared/ services
6. Auth boundary: protected routes use ProtectedRoute wrapper
