# Indexing Rules

1. Index userId on all user-scoped collections
2. Index { userId, createdAt } for sorted queries
3. Index { userId, mode } for chat history lookups
4. Index { userId, status } for project filtering
5. Index { userId, timestamp } for activity feed queries
6. Email index must be unique
