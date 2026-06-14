# Frontend — Component Rules

1. Use shared UI components (Button, Card, Badge, Input, etc.) from `src/shared/components/ui/`
2. New components go in the feature's `components/` directory
3. Props typed with TypeScript interface above the component
4. Use `cn()` utility from `@shared/lib/utils` for conditional classes
5. Components are functions, not arrow functions (for consistency)
6. Export component and type separately
7. Use Framer Motion `motion.div` for enter/exit animations
