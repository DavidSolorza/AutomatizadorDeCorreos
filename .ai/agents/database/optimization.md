# Database — Optimization

1. Project only needed fields in queries (lean() for read-only)
2. Pagination on list endpoints (limit + skip)
3. Compound indexes for common query patterns
4. Embedded documents reduce joins (stages/topics inside path)
5. Upsert for stats to avoid separate create/update
6. Capped activity collection to 20 recent items per user
