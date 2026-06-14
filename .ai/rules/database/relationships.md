# Relationships Rules

1. Users -> LearningPaths: one-to-many (userId reference)
2. Users -> Projects: one-to-many (userId reference)
3. Users -> ChatHistory: one-to-many (userId reference, mode-scoped)
4. Users -> Activity: one-to-many (userId reference)
5. Users -> Stats: one-to-one (userId reference, unique)
6. LearningPath -> Stages: embedded array
7. Stage -> Topics: embedded array
8. Topic -> Resources: embedded array
