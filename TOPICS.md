# System Design and Distributed Systems Topics

These topics are the next documentation category after Java, PostgreSQL, and Spring. The category must remain language-neutral and framework-neutral. Every concept must first be explained through plain language, diagrams, protocols, algorithms, state transitions, and pseudocode. A language or framework may demonstrate a concept, but it must never define the concept.

## Example language and framework policy

Examples may use only these five language ecosystems:

1. Java, using the JDK and a relevant framework such as Spring Boot, Micronaut, Quarkus, or Vert.x.
2. TypeScript or JavaScript, using Node.js and a relevant framework such as Fastify, Express, NestJS, or Hono.
3. Rust, using the standard library and a relevant ecosystem such as Tokio, Axum, Actix Web, or Tonic.
4. Python, using the standard library and a relevant framework such as FastAPI, Django, Flask, asyncio, or Celery.
5. Go, using the standard library and a relevant framework or library such as `net/http`, Chi, Gin, Fiber, or gRPC-Go.

Use pseudocode first when the idea is algorithmic. Add code only when it improves understanding. Keep code examples small enough to compare behavior across languages. Do not force all five languages into every section, but rotate them across the category so that no single language or framework dominates. When language behavior affects correctness, show equivalent focused examples in multiple languages and explain the difference.

Framework-specific conveniences must be separated from the underlying system-design principle. For example, explain timeouts, deadlines, retries, idempotency, backpressure, transactions, and message acknowledgement independently before showing how a framework exposes them.

## Required structure for every topic

Every topic must be complete enough to become one standalone pull request and must include:

1. A plain-language mental model and precise terminology.
2. Fundamentals, prerequisites, and the problem being solved.
3. Relevant internals, algorithms, state transitions, and failure mechanics.
4. Diagrams, request flows, timelines, decision tables, or pseudocode where they improve understanding.
5. Practical examples using one or more approved language ecosystems.
6. Production architecture, deployment, operations, observability, and troubleshooting.
7. Security, privacy, abuse, and trust-boundary considerations.
8. Performance, scalability, capacity, latency, throughput, and cost trade-offs.
9. Failure scenarios, edge cases, common mistakes, and safer corrections.
10. Testing strategies, including unit, integration, load, fault, and recovery testing where relevant.
11. Hands-on exercises and system-design scenarios with expected reasoning.
12. Interview questions with detailed model answers and follow-up questions.
13. A concise revision cheat sheet.
14. Current primary official references and standards.

Examples must use realistic domains such as orders, payments, inventory, notifications, chat, file storage, search, analytics, or content feeds. Each design must state its assumptions and explain why a decision is suitable for that workload instead of presenting one architecture as universally correct.

## Daily schedule

- Day 1: Topics 1 to 4
- Day 2: Topics 5 to 8
- Day 3: Topics 9 to 12
- Day 4: Topics 13 to 16

The daily target is four completed topics. This category-specific schedule is explicitly approved as an exception to the default two-topic daily limit in `AGENTS.md`. Every topic must use its own `codex/{feature-name}` branch and its own pull request. Never combine multiple topics in one pull request. Within a day, start each later topic only after the preceding topic is merged, refresh `main`, and read the latest `TOPICS.md`. If reviews or merges prevent four topics from being completed safely, move the unfinished topics to the next day instead of combining or rushing them.

## Day 1

### Topic 1 - System design fundamentals and capacity estimation

Status: Pending

Cover functional and non-functional requirements, constraints, assumptions, workload shapes, latency, throughput, concurrency, availability, durability, consistency, scalability, reliability, maintainability, privacy, compliance, and cost. Explain SLIs, SLOs, SLAs, error budgets, percentiles, peak-to-average ratios, read-to-write ratios, and steady versus burst traffic. Teach back-of-the-envelope estimation for requests per second, concurrent requests, bandwidth, storage growth, cache size, connection counts, CPU, memory, and headroom. Show how to identify bottlenecks, single points of failure, critical paths, and failure domains. Explain architecture diagrams, data-flow diagrams, sequence diagrams, capacity tables, trade-off records, and a repeatable system-design interview method from requirement clarification through final review. Include a complete first-pass design and estimation exercise for a small URL-shortening or notification service.

Dependencies: None.

### Topic 2 - Networking, DNS, TCP, TLS, HTTP, REST, and RPC

Status: Pending

Cover the network stack from application to transport and IP, sockets, ports, packets, MTU, fragmentation, routing, NAT, firewalls, proxies, and connection state. Explain DNS resolution, recursive and authoritative servers, records, TTLs, caching, propagation, load distribution, and common DNS failures. Cover TCP handshakes, reliability, ordering, retransmission, flow control, congestion control, keepalive, connection pooling, head-of-line blocking, and connection exhaustion. Explain UDP and QUIC trade-offs. Cover TLS handshakes, certificates, trust chains, hostname verification, session resumption, mTLS, and termination. Explain HTTP semantics, methods, status codes, headers, caching, conditional requests, idempotency, HTTP/1.1, HTTP/2, HTTP/3, REST, JSON, Protobuf, gRPC, streaming, WebSocket, Server-Sent Events, API compatibility, deadlines, cancellation, and payload limits. Trace a complete secure request from a client through DNS, a load balancer, and a backend service.

Dependencies: Topic 1.

### Topic 3 - Scalability, load balancing, service discovery, and rate control

Status: Pending

Cover vertical and horizontal scaling, stateless and stateful services, shared-nothing design, elasticity, autoscaling signals, warm-up, cold starts, and capacity during failure. Explain Layer 4 and Layer 7 load balancing, client-side and server-side balancing, algorithms such as round robin, least connections, weighted routing, power of two choices, hashing, and locality-aware routing. Cover health checks, readiness, draining, connection reuse, sticky sessions, uneven load, slow-start behavior, failover, reverse proxies, API gateways, global traffic management, and service discovery using registries or DNS. Explain rate limiting, quotas, admission control, token bucket, leaky bucket, fixed and sliding windows, distributed counters, fairness, burst handling, backpressure, and load shedding. Include a design that scales an API from one instance to multiple zones while protecting dependencies from overload.

Dependencies: Topics 1 and 2.

### Topic 4 - Data storage and data-model selection

Status: Pending

Cover how access patterns, consistency needs, query shapes, data size, write rate, retention, durability, and operational constraints drive storage decisions. Compare relational, key-value, document, wide-column, graph, time-series, search, object, and in-memory stores without tying the decision to a vendor. Explain rows, documents, keys, indexes, secondary indexes, materialized views, inverted indexes, LSM trees, B-trees, append-only storage, compaction, write amplification, read amplification, and storage engines at a conceptual level. Cover schema design, normalization, denormalization, data ownership, polyglot persistence, schema evolution, migrations, archival, retention, backup, restore, encryption, multi-tenancy, and data locality. Include decision matrices and designs for orders, chat messages, search documents, time-series metrics, and file metadata.

Dependencies: Topic 1. Existing PostgreSQL knowledge is helpful but not required.

## Day 2

### Topic 5 - Caching and content delivery

Status: Pending

Cover why caches work, locality, working sets, hit ratio, miss cost, and latency distribution. Explain browser, client, application, distributed, database, reverse-proxy, edge, and CDN caches. Cover cache-aside, read-through, write-through, write-behind, refresh-ahead, memoization, TTL, time to idle, eviction algorithms, invalidation, versioned keys, tagging, negative caching, stale reads, stale-while-revalidate, and consistency with source-of-truth data. Explain cache stampedes, request coalescing, probabilistic early refresh, hot keys, large objects, cache penetration, poisoning, tenant isolation, memory pressure, fail-open versus fail-closed choices, and cache observability. Include a cached read path and a safe write-invalidation flow with failure timelines.

Dependencies: Topics 3 and 4.

### Topic 6 - Distributed-systems fundamentals, time, ordering, and consistency

Status: Pending

Cover processes, nodes, messages, asynchronous networks, partial failure, uncertainty, partitions, crash-stop and crash-recovery models, safety, liveness, and impossibility intuition. Explain wall clocks, monotonic clocks, clock skew, drift, synchronization, timeouts, causality, happens-before, Lamport clocks, vector clocks, version vectors, logical ordering, and conflict detection. Compare strong, eventual, causal, read-your-writes, monotonic-read, monotonic-write, consistent-prefix, sequential, linearizable, and serializable guarantees. Explain CAP without slogans, PACELC, latency-consistency trade-offs, availability definitions, stale reads, session guarantees, and why database isolation is not identical to distributed consistency. Use timelines and histories to evaluate whether example executions satisfy a stated guarantee.

Dependencies: Topics 1, 2, and 4.

### Topic 7 - Replication, partitioning, sharding, and quorum systems

Status: Pending

Cover leader-follower, multi-leader, and leaderless replication; synchronous and asynchronous replication; replication logs; acknowledgements; lag; read replicas; failover; conflict detection; last-write-wins risks; merge strategies; read repair; anti-entropy; and hinted handoff. Explain quorum reads and writes, sloppy quorums, tunable consistency, replica placement, and failure tolerance. Cover horizontal and vertical partitioning, range and hash partitioning, consistent hashing, virtual nodes, partition maps, secondary indexes, fan-out queries, hotspots, skew, tenant placement, rebalancing, resharding, online migration, and routing. Explain globally unique ID strategies, sequence allocation, UUID variants, Snowflake-style IDs, ordering leakage, and clock risks. Include a sharded order or chat system and show behavior during replica and network failures.

Dependencies: Topics 4 and 6.

### Topic 8 - Coordination, consensus, leader election, leases, and distributed locks

Status: Pending

Cover why coordination is expensive, when it is required, and how to design systems that minimize it. Explain consensus goals, quorums, terms or epochs, replicated logs, leader election, log matching, commit rules, membership changes, snapshots, and safety during partitions using Raft as the main teaching model while comparing Paxos at a high level. Cover heartbeats, failure detectors, leases, fencing tokens, split brain, lock ownership, lock expiry, clock assumptions, distributed mutexes, semaphores, barriers, and coordination services. Explain why a lock without fencing can corrupt data, why lease renewal can fail, and when a database constraint or idempotent operation is safer than a distributed lock. Include a leader-elected scheduler and a fenced inventory allocator.

Dependencies: Topics 6 and 7.

## Day 3

### Topic 9 - Resilience, retries, backpressure, and overload control

Status: Pending

Cover transient, permanent, partial, slow, and ambiguous failures. Explain timeout selection, connect and request timeouts, deadlines, cancellation, retry eligibility, bounded retries, exponential backoff, jitter, retry budgets, retry amplification, idempotency requirements, and hedged requests. Cover circuit breakers, bulkheads, fallbacks, graceful degradation, dependency isolation, bounded queues, backpressure, admission control, load shedding, concurrency limits, health-check design, brownouts, and cascading failures. Explain why adding retries, replicas, caches, or health checks can make an outage worse. Include client and server examples, failure timelines, capacity reasoning, metrics, alerting, chaos experiments, and a recovery playbook for an overloaded dependency.

Dependencies: Topics 2, 3, 6, 7, and 8.

### Topic 10 - Messaging, event-driven architecture, and stream processing

Status: Pending

Cover commands, events, messages, queues, publish-subscribe, append-only logs, brokers, topics, partitions, producers, consumers, consumer groups, offsets, acknowledgements, retention, compaction, ordering scopes, keys, rebalancing, lag, batching, flow control, and replication. Explain at-most-once, at-least-once, effectively-once, and exactly-once claims; duplicate delivery; idempotent producers and consumers; deduplication; poison messages; retries; dead-letter queues; replay; schema evolution; compatibility; event envelopes; and observability. Compare work queues, event buses, log-based streaming, and direct RPC. Cover stream transformations, windows, event time, processing time, late data, watermarks, stateful processing, and recovery. Include an order-event pipeline and a notification worker using approved language ecosystems.

Dependencies: Topics 2, 6, 7, and 9.

### Topic 11 - Distributed transactions, sagas, outbox, and reliable workflows

Status: Pending

Cover local versus distributed transactions, atomicity boundaries, two-phase commit, prepare and commit phases, coordinator failure, blocking, recovery, and why distributed transactions are often avoided across services. Explain sagas, orchestration, choreography, compensating actions, semantic rollback, pivot transactions, retries, timeouts, workflow state machines, durable execution, and human intervention. Cover the transactional outbox, inbox, deduplication, change data capture, polling publishers, ordering, relay failure, idempotency keys, reconciliation, and exactly-once limitations. Explain dual-write failures and ambiguous outcomes. Include a complete order, payment, and inventory workflow with state transitions, failure matrices, recovery jobs, security boundaries, and audit requirements.

Dependencies: Topics 4, 6, 7, 9, and 10.

### Topic 12 - Architecture styles, modular monoliths, microservices, and service boundaries

Status: Pending

Cover layered, hexagonal, clean, modular-monolith, microservices, event-driven, web-queue-worker, serverless, and service-oriented architecture styles. Explain cohesion, coupling, modules, bounded contexts, aggregates, domain ownership, team ownership, independent deployment, data ownership, database per service, shared-database risks, synchronous and asynchronous communication, API gateways, backend-for-frontend, service mesh, sidecars, contract versioning, consumer-driven contracts, and service discovery. Compare a well-structured monolith with microservices and explain when distribution is unjustified. Cover decomposition by business capability, strangler migration, anti-corruption layers, distributed-monolith symptoms, operational overhead, security boundaries, testing, local development, and governance. Include a staged evolution from a modular order platform to independently deployable services.

Dependencies: Topics 2 through 11, especially Topics 10 and 11.

## Day 4

### Topic 13 - Observability, SRE, capacity planning, and incident response

Status: Pending

Cover observability versus monitoring, logs, metrics, traces, profiles, events, correlation IDs, context propagation, sampling, structured telemetry, cardinality, retention, redaction, and telemetry pipelines. Explain RED, USE, golden signals, SLIs, SLOs, error budgets, burn-rate alerts, availability math, dependency objectives, tail latency, saturation, queueing, Little's Law, capacity models, forecasting, load tests, stress tests, soak tests, scalability tests, chaos experiments, and recovery tests. Cover dashboards, actionable alerts, runbooks, on-call readiness, incident command, severity, communication, mitigation, root-cause analysis, blameless postmortems, and follow-up ownership. Include a complete investigation of a high-latency distributed service using evidence across multiple components.

Dependencies: Topics 1, 3, 6, 9, 10, 11, and 12.

### Topic 14 - Security, privacy, and abuse resistance in distributed systems

Status: Pending

Cover threat modeling, assets, actors, attack surfaces, trust boundaries, defense in depth, least privilege, secure defaults, fail-safe behavior, and zero-trust principles. Explain service and user identity, authentication, authorization, sessions, tokens, API keys, OAuth 2.0, OpenID Connect, workload identity, TLS, mTLS, certificate rotation, secrets, key management, encryption at rest and in transit, tenant isolation, network segmentation, and policy enforcement. Cover replay attacks, request signing, SSRF, injection, deserialization, confused deputy problems, privilege escalation, denial of service, rate abuse, message security, cache poisoning, supply-chain risks, dependency integrity, image provenance, audit trails, data classification, retention, deletion, residency, backups, privacy, and incident response. Include a threat model and security review for a multi-service payment or file-sharing design.

Dependencies: Topics 2, 4, 5, 7, 9, 10, 11, 12, and 13.

### Topic 15 - Deployment architecture, availability, multi-region design, and disaster recovery

Status: Pending

Cover processes, virtual machines, containers, immutable artifacts, image layers, registries, configuration, secrets, resource requests and limits, scheduling, orchestration, service networking, health checks, readiness, liveness, startup, graceful shutdown, and autoscaling at a platform-neutral level. Explain rolling, recreate, blue-green, canary, shadow, and feature-flag releases; compatibility during rollout; expand-and-contract migrations; rollback; and progressive delivery. Cover zones, regions, fault domains, redundancy, active-passive and active-active designs, traffic failover, data replication, consistency, split brain, capacity during failure, backups, restore testing, RPO, RTO, disaster declarations, dependency failures, and game days. Use Docker, Kubernetes, and cloud services only as examples, not as prerequisites or the definition of the concepts.

Dependencies: Topics 3, 7, 8, 9, 11, 12, 13, and 14.

### Topic 16 - End-to-end system design case studies and interview preparation

Status: Pending

Apply the complete system-design method to a URL shortener, distributed rate limiter, notification platform, real-time chat system, file-storage and sharing service, search or autocomplete service, content feed, and payment or order platform. For every case study, clarify requirements, estimate load, define APIs and events, choose data models, draw the high-level design, trace critical paths, identify bottlenecks, evolve the design, handle failures, secure trust boundaries, plan observability, estimate cost drivers, and explain alternatives. Include interviewer follow-up questions about sudden growth, regional failure, hot keys, data loss, consistency, abuse, privacy, migrations, and operational incidents. End with reusable requirement, estimation, component-selection, reliability, security, performance, and final-review checklists.

Dependencies: Topics 1 through 15.

## Completion rules

For each topic:

1. Refresh the repository from `main` and read the latest `AGENTS.md` and `TOPICS.md` before starting.
2. Create a new branch named `codex/{feature-name}`.
3. Add only one topic in the pull request.
4. Preserve the existing application design and do not change styling.
5. Update the manifest and navigation for the new note.
6. Keep the explanation language-neutral and framework-neutral.
7. Use only the approved Java, TypeScript or JavaScript, Rust, Python, and Go ecosystems for code examples.
8. Follow the complete required topic structure defined in this file.
9. Write complete notes so the reader does not need another source for the topic.
10. Research technical claims using current primary official specifications and documentation.
11. Run all defined tests without editing the tests.
12. Verify the Git author and GitHub account required by `AGENTS.md`.
13. Open a correctly named pull request.
14. Change the topic status from `Pending` to `Completed` only after its pull request is merged.
