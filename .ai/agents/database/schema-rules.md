# Database Rules

1. Design schemas to match shared/types/ exactly
2. Use embedded documents for one-to-few relationships (stages -> topics -> resources)
3. Use references for one-to-many relationships (user -> paths)
4. Always index foreign keys (userId) and frequently queried fields
5. Use timestamps for all documents
6. Validate enums at the schema level
7. Prefer _id: true on subdocuments for client-side identification
