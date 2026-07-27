## These file will include the topics that are needed to be added in docs.

Topic 1 — SQL fundamentals (solid, not shaky)
SELECT/INSERT/UPDATE/DELETE, all join types (inner, left, right, full, cross), GROUP BY/HAVING, aggregates, subqueries, DISTINCT. You probably have most of this — the goal here is no gaps, because everything above stands on it. Add UPSERT (INSERT ... ON CONFLICT) since it's Postgres-specific and heavily used.

Topic 2 — Advanced querying
CTEs (WITH), recursive CTEs, window functions (ROW_NUMBER, RANK, LAG/LEAD, running totals), DISTINCT ON, lateral joins, CASE expressions. Window functions are the highest-ROI item here — underused and instantly impressive in interviews.

Topic 3 — Schema design & data modeling
Normalization (1NF → 3NF) and when to deliberately denormalize, primary/foreign keys, constraints (CHECK, UNIQUE, NOT NULL), data types that matter (UUID, TIMESTAMPTZ vs TIMESTAMP, NUMERIC vs FLOAT, arrays, ENUM), and JSONB — when to use a column vs JSONB, and how to index inside it.

Topic 4 — Indexing (the big one)
B-tree vs Hash vs GIN vs GiST vs BRIN, composite indexes and column order, partial indexes, covering indexes (INCLUDE), expression indexes. Critically: why an index gets ignored. This is where you go from "knows SQL" to "makes queries fast."

Topic 5 — EXPLAIN ANALYZE & query optimization
Reading query plans, seq scan vs index scan vs bitmap scan, nested loop vs hash vs merge joins, spotting the difference between estimated and actual rows, work_mem effects. Pair this with Topic 4 — indexing without reading plans is guessing. This is the skill that pays off daily.

Topic 6 — Transactions, MVCC & isolation
BEGIN/COMMIT/ROLLBACK, savepoints, the four isolation levels and the anomalies each prevents (dirty/non-repeatable/phantom reads), and Postgres's MVCC model — row versions, xmin/xmax. This connects straight to the MVCC/snapshot ideas from your OOP gotchas, so it'll land fast.

Topic 7 — Locking & concurrency
Row vs table locks, SELECT ... FOR UPDATE, FOR SHARE, deadlock detection, advisory locks, and SKIP LOCKED (how you build a reliable job queue on plain Postgres — a genuinely impressive thing to know).

Topic 8 — Postgres internals: VACUUM, WAL, bloat
Why UPDATE is really insert-plus-mark-dead, dead tuples, table/index bloat, VACUUM/autovacuum, and the write-ahead log (durability + crash recovery). This is where "uses Postgres" becomes "understands Postgres." Ties directly to the WAL concept from the distributed-systems projects.

Topic 9 — Performance tuning & operations
shared_buffers, work_mem, effective_cache_size, the connection model (process-per-connection) and why connection pooling / PgBouncer matters, pg_stat_statements to find slow queries, table partitioning for large tables.

Topic 10 — Replication & scaling
Streaming replication, read replicas, replication lag, logical replication, and high-level HA/failover. This is the "scale it in production" tier.

Topic 11 — Extensions & specialized features
pg_trgm (fuzzy search), PostGIS (geospatial), full-text search (tsvector/tsquery), pgvector (embeddings — increasingly relevant). Pick based on what your work actually needs.