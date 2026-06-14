# Database — Relationships

- User 1:N LearningPath (userId reference)
- User 1:N Project (userId reference)
- User 1:1 Stats (userId unique)
- User 1:N Activity (userId reference)
- User 1:2 ChatHistory (userId + mode unique)
- LearningPath embeds Stage[] (owned, no separate collection)
- Stage embeds Topic[] (owned, no separate collection)
- Topic embeds Resource[] (owned, no separate collection)
