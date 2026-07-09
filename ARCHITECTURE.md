# System Architecture

This document describes the backend architecture of the KSSEM College ERP System following its migration from a monolithic Node.js/GraphQL server to a Go-based microservices architecture.

## Overview

The system is designed around a set of independently-deployable Go microservices that communicate internally via gRPC and expose their capabilities to the Next.js frontend via an API Gateway using `grpc-gateway`.

### Core Components

1.  **API Gateway (`gateway/`)**
    - Acts as the single entry point for all frontend traffic.
    - Translates incoming REST/JSON requests into gRPC calls using `grpc-gateway`.
    - Handles edge concerns such as CORS and Authentication (verifying Firebase JWTs).
    - Propagates a Correlation ID (`X-Correlation-ID`) to all downstream services for distributed tracing.

2.  **Academic Service (`services/academic/`)**
    - Manages domain entities related to student life: Profiles, Classrooms, Attendance, Grades, and Events.
    - Interacts directly with Firestore to read and write academic data.

3.  **Admin Service (`services/admin/`)**
    - Handles administrative functions such as User Management (creating/updating students and faculty) and System Settings.
    - Acts as the orchestrator for user creation: it delegates profile creation to the Academic Service via gRPC, ensuring domain boundaries are respected.
    - Manages the writing of Audit Logs for sensitive administrative actions.

4.  **Communication Service (`services/communication/`)**
    - Handles real-time features like chat, notifications, and streams.
    - Leverages **Redis Streams** for async message delivery, ensuring reliable, decoupled communication (e.g., publishing a "Grade Updated" event).
    - Provides Server-Sent Events (SSE) endpoints via the Gateway, pushing updates directly to connected web clients without the need for polling.

## Data Flow & Communication

- **External (Edge to Gateway):** The Next.js frontend communicates with the API Gateway using standard REST endpoints over HTTP/1.1 (and SSE for streams).
- **Internal (Gateway to Services):** The Gateway routes requests to the appropriate microservice via high-performance gRPC over HTTP/2.
- **Service to Service (Synchronous):** When one service requires data from another (e.g., Admin Service needing to create a student profile), it acts as a gRPC client and calls the target service directly.
- **Service to Service (Asynchronous):** For decoupled event notifications (e.g., chat messages or system alerts), services publish messages to Redis Streams. Background workers in the Communication Service consume these streams using Consumer Groups to ensure reliable delivery (`pending: 0`, `lag: 0`), and then push the messages to connected users via SSE.

## Migration Journey: Lessons Learned

The migration from the original monolith to this distributed architecture uncovered several critical insights that underscore the value of strict domain boundaries and rigorous verification.

### 1. The Value of Edge Verification (Mocking Auth)
During the early phases of migration, we encountered an issue where Firebase Admin SDK initialization failed within Docker due to missing credentials. Rather than blocking on infrastructure, we implemented an explicit `AUTH_MODE=mock` bypass at the Gateway layer. This allowed us to verify the complex routing path (Gateway → Auth Middleware → gRPC routing → Academic Container) in isolation, proving that the network topology and protobuf mappings were correct before tackling production credentials.

### 2. Catching Hidden Assumptions (Collection Mismatches)
In the original monolith, because all services lived in the same memory space, data access was often decentralized and ad-hoc. When migrating the `GetStudentProfile` endpoint, a direct translation led to querying a `student_profiles` collection. Testing with dummy UIDs yielded `NotFound` errors—which were expected. However, testing with a *real* UID revealed a bug: the data was actually stored in the `users` collection. 

This exposed a critical flaw in relying on "expected" failure modes. Only by executing the complete end-to-end loop against real data did we uncover that the original app was using the `users` collection for profiles. 

### 3. Enforcing Domain Ownership (Audit Logs)
A similar issue surfaced with Audit Logs. The original monolith allowed any service to write to the audit log directly. During the migration, the Go GraphQL resolver was configured to read from `audit_logs` (snake_case), while the frontend was writing to `auditLogs` (camelCase). 

To fix this, we centralized the writing and reading of audit logs entirely within the `AdminService`. The `AdminService` now acts as the sole owner of the `auditLogs` collection, explicitly wrapping user creation and modification calls in transaction-like operations that guarantee an audit log is written correctly. This prevents cross-service data leakage and enforces strict boundaries.

### 4. Real-time Streams vs Polling
The original architecture relied on direct Firestore subscriptions or polling for real-time updates. The new architecture shifted this responsibility to the backend. By integrating Redis Streams and Server-Sent Events (SSE), we achieved true server-push capabilities. The frontend now subscribes to an SSE stream, and the Communication Service pushes messages (e.g., `"hello from checkpoint 3"`) down the wire as they arrive from Redis. This significantly reduces frontend complexity and client-side database reads.

## Getting Started

To run the full microservices stack locally:

1. Ensure Docker and `docker-compose` are installed.
2. Start the infrastructure (Redis):
   ```bash
   docker-compose up -d redis
   ```
3. Build the Go workspace (from the repository root):
   ```bash
   go build all
   ```
4. Start the services (either via docker-compose or running the built binaries individually).

All proto definitions are located in `proto/`, and the generated Go code is checked into the repository to simplify the build process.
