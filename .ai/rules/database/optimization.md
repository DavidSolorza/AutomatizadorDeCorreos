# Optimization Rules

1. Project only needed fields in queries (.select, .lean())
2. Use .lean() for read-only queries
3. Limit results on activity and chat history (20 items)
4. Index compound queries for sort + filter
5. Avoid large embedded arrays (stages with 500+ topics -> separate collection)
