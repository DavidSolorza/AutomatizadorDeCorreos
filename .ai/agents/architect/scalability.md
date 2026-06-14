# Architect Scalability

1. New features = new directory under features/
2. New shared components = files in shared/components/
3. New types = extend shared/types/
4. New API endpoints = new route in server/
5. Each page is lazy-loaded via React.lazy()
6. Stores are independent and composable (not monolithic)
