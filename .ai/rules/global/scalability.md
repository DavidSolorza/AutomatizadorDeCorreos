# Scalability Rules

1. New features = new directory with its own pages, services, components
2. Shared code is extracted to shared/ as it grows
3. No hardcoded strings (use config or constants)
4. Environment variables for environment-specific values
5. DbAdapter pattern allows switching storage without code changes
