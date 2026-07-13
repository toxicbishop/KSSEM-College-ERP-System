# KSSEM College ERP System Backend Architecture

This document describes the backend architecture of the KSSEM College ERP System. The system is built as a high-performance **Go Modular Monolith**, sitting alongside a Next.js frontend, utilizing Firebase and Google Cloud services for storage and real-time operations.

## Architectural Overview

The backend is a single, unified Go service (located entirely in the `server/` directory) that organizes domain logic into distinct, modular internal packages. This provides the performance and simplicity of a monolith while maintaining the clean separation of concerns usually associated with microservices.

### Core Modules

The monolith is broken down into the following distinct domains under `server/internal/`:

1. **Academic Module (`server/internal/academic/`)**
   - Handles student profiles, attendance, grades, classrooms, and academic events.
   - Core API endpoints: `/api/academic/*`

2. **Admin Module (`server/internal/admin/`)**
   - Manages user roles, system settings, and high-level platform administration.
   - Core API endpoints: `/api/admin/*`

3. **Communication Module (`server/internal/communication/`)**
   - Handles real-time chat, notifications, and streams via Server-Sent Events (SSE).
   - Entirely in-process and natively managed by the Go server.
   - Core API endpoints: `/api/communication/*`

### Unified Server Structure

Instead of distributing authentication and routing across a complex API Gateway, the monolithic approach centralizes it:
- **`server/main.go`**: Initializes the chi router, attaches global middleware (CORS, Auth), and registers sub-routers for each module.
- **`server/pkg/auth/`**: Centralized authentication logic utilizing Firebase Admin SDK for minting and verifying custom claims (e.g., `admin`, `teacher`, `student`).
- **`server/pkg/middleware/`**: Cross-cutting concerns such as logging, CORS, and JWT validation.

### Deployment & CI/CD

- The entire backend is built into a single, lightweight Docker container (`server/Dockerfile`).
- Deployed on **Render** as a web service.
- The `render.yaml` configuration defines the deployment blueprint, mapping environment variables (such as `CORS_ALLOWED_ORIGINS` and Firebase credentials) directly to the unified process.

### Benefits of the Modular Monolith

- **Zero Network Overhead**: Internal module-to-module calls happen in-process rather than over HTTP or gRPC.
- **Simplified Deployment**: A single Docker container to build, push, and scale.
- **Shared State**: Easy integration of real-time features like SSE without needing external message brokers (e.g., Redis).
- **Strong Typing & Maintainability**: Cleanly separated internal packages enforce boundaries without the operational complexity of distributed systems.
