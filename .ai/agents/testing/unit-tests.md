# Testing — Unit Tests

- Test file: `__tests__/` next to the source file, named `sourceName.test.ts`
- One describe block per class/service/component
- One it() per behavior
- Mock external dependencies (localStorage, fetch, etc.)
- Use vi.spyOn for service method mocking
- Test happy path, error path, and edge cases
