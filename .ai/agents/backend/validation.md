# Backend — Validation

1. Validate required fields before database operations
2. Return 400 with specific error message on validation failure
3. User input sanitized (trim, lowercase for email)
4. MongoDB schema validation as second line of defense
5. Cast _id to string when returning to client
6. ISO date strings for all date fields in API responses
