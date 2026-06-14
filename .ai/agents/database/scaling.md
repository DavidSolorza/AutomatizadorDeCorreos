# Database — Scaling

- Read-heavy workload: learning paths viewed more than written
- Write-heavy on topic completion (toggling completed status)
- Embedding stages+topics in path document (1 read per path)
- Shard by userId for horizontal scaling
- Connection pool with default 10 connections
- Atlas M0 (free) sufficient for development
