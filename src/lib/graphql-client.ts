/**
 * This file has been replaced by the REST-based API client (api-client.ts).
 *
 * The system has migrated from GraphQL to a gRPC + REST architecture.
 * All frontend data access now goes through src/lib/api-client.ts which
 * calls the API Gateway over HTTP/1.1.  The Gateway routes those calls
 * to the appropriate Go microservices via gRPC.
 *
 * This stub is kept as a compilation safety net.  Any remaining
 * imports of this module will fail at compile time, making it easy
 * to spot and remove legacy references.
 */

// Deliberately broken — any import of this module will cause a TypeScript error.
const __LEGACY_GRAPHQL_CLIENT_REMOVED__ = true;
export { __LEGACY_GRAPHQL_CLIENT_REMOVED__ };
