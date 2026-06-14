# Database — Indexing

- User: email (unique)
- LearningPath: userId + createdAt (compound, for listing paths)
- Project: userId + status (compound, for filtering)
- Activity: userId + timestamp (compound, for recent activity)
- Stats: userId (unique)
- ChatHistory: userId + mode (compound, for loading history)
