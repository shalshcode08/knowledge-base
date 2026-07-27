# Spring and Spring Boot Topics

These topics are the next documentation category after Java and PostgreSQL. Each topic must be covered in depth, written in easy language, include practical examples, production considerations, common mistakes, and interview questions.

## Daily schedule

- Day 1: Topics 1 to 4
- Day 2: Topics 5 to 8
- Day 3: Topics 9 to 12

Four topics must be completed each day. Every topic must use its own `codex/{feature-name}` branch and its own pull request. Do not combine multiple topics into one pull request.

## Day 1

### Topic 1 - Spring Core fundamentals

Status: Pending

Cover the purpose of Spring, inversion of control, dependency injection, the IoC container, `ApplicationContext`, bean definitions, component scanning, constructor injection, bean scopes, bean lifecycle, lazy initialization, `@Primary`, `@Qualifier`, configuration classes, Java-based configuration, and circular dependency problems. Explain why constructor injection is preferred and include common interview questions.

### Topic 2 - Spring Boot fundamentals

Status: Pending

Cover the purpose of Spring Boot, project structure, starters, dependency management, auto-configuration, conditional configuration, `SpringApplication`, embedded servers, configuration files, profiles, configuration precedence, `@ConfigurationProperties`, environment variables, startup lifecycle, application runners, DevTools, executable JAR files, and the differences between Spring Framework and Spring Boot.

### Topic 3 - Spring MVC and REST APIs

Status: Pending

Cover the servlet request lifecycle, `DispatcherServlet`, controllers, request mappings, path variables, request parameters, headers, request and response bodies, DTOs, JSON serialization, validation, custom validators, global exception handling, `ProblemDetail`, response status codes, content negotiation, file upload and download, pagination, API versioning, idempotency, CORS, and production-quality REST API design.

### Topic 4 - Spring JDBC and database access

Status: Pending

Cover JDBC problems solved by Spring, `DataSource`, connection pooling, HikariCP, `JdbcTemplate`, `NamedParameterJdbcTemplate`, row mappers, batch operations, generated keys, exception translation, transaction boundaries, PostgreSQL integration, query safety, resource management, testing database code, performance considerations, and when JDBC is preferable to an ORM.

## Day 2

### Topic 5 - JPA and Hibernate fundamentals

Status: Pending

Cover ORM concepts, JPA versus Hibernate, entities, identifiers, entity lifecycle states, persistence context, dirty checking, flushing, first-level cache, mappings, value types, relationships, owning sides, cascading, orphan removal, inheritance strategies, optimistic locking, pessimistic locking, JPQL, Criteria API, native SQL, and the differences between `persist`, `merge`, and `save`.

### Topic 6 - Spring Data JPA

Status: Pending

Cover repository abstractions, repository interfaces, derived query methods, JPQL queries, native queries, named queries, projections, specifications, Query by Example, pagination, sorting, auditing, custom repositories, bulk updates, entity graphs, transactionality, locking, PostgreSQL-specific queries, and when repository abstractions should not be used.

### Topic 7 - Transaction management

Status: Pending

Cover local transactions, Spring transaction abstractions, `@Transactional`, proxy-based behavior, propagation modes, isolation levels, read-only transactions, rollback rules, checked versus unchecked exceptions, self-invocation problems, transaction boundaries, nested transactions, savepoints, locking interactions, long-running transaction problems, connection pool effects, testing transactions, and patterns for external side effects.

### Topic 8 - Spring Security

Status: Pending

Cover the security filter chain, authentication, authorization, `SecurityContext`, password storage, sessions, stateless security, JWT access and refresh tokens, method security, role and authority modeling, CSRF, CORS, OAuth 2.0, OpenID Connect, resource servers, login flows, logout, security headers, exception handling, testing security, common vulnerabilities, and production security practices.

## Day 3

### Topic 9 - Testing Spring applications

Status: Pending

Cover the testing pyramid, JUnit, Mockito, unit tests, slice tests, `@SpringBootTest`, context caching, MockMvc, WebTestClient, repository tests, transaction behavior in tests, Testcontainers with PostgreSQL, dynamic properties, security tests, integration tests, contract tests, fixture design, test isolation, avoiding brittle tests, and choosing the smallest useful Spring test context.

### Topic 10 - Caching, scheduling, async processing, and events

Status: Pending

Cover Spring Cache, cache abstraction, cache keys, invalidation, TTL considerations, Redis integration, cache stampedes, `@Scheduled`, task scheduling, `@Async`, executors, thread pools, exception handling, application events, transactional events, domain events, retry patterns, idempotency, and when to move work to a durable message broker.

### Topic 11 - Observability and production operations

Status: Pending

Cover Spring Boot Actuator, health indicators, readiness and liveness, metrics, Micrometer, logs, structured logging, correlation IDs, distributed tracing, configuration and secret management, graceful shutdown, startup probes, connection pool monitoring, thread dumps, heap diagnostics, error reporting, deployment concerns, containerization, and practical production troubleshooting.

### Topic 12 - Spring internals and interview preparation

Status: Pending

Cover bean creation phases, bean post-processors, dependency resolution, proxies, JDK proxies versus CGLIB, AOP terminology, advice and pointcuts, annotation processing, auto-configuration internals, conditional annotations, startup events, circular references, `@Transactional` and `@Async` proxy limitations, common Spring Boot failure scenarios, debugging techniques, system-design connections, and comprehensive interview questions with answers.

## Completion rules

For each topic:

1. Refresh the repository from `main` before starting.
2. Create a new branch named `codex/{feature-name}`.
3. Add only one topic in the pull request.
4. Follow the existing application design without changing styling.
5. Update the manifest and navigation for the new note.
6. Write complete notes so the reader does not need another source for the topic.
7. Run all defined tests without editing the tests.
8. Verify the Git author and GitHub account required by `AGENTS.md`.
9. Open a correctly named pull request.
10. Change the topic status from `Pending` to `Completed` only after its pull request is merged.
