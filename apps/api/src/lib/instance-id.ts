import { env } from "../env";

/**
 * Generates a unique instance identifier for this API server instance.
 * Used to distinguish between multiple instances in horizontal scaling scenarios.
 *
 * The instance ID is either:
 * 1. Provided via the INSTANCE_ID environment variable (recommended for production)
 * 2. Auto-generated using a random UUID
 *
 * In Kubernetes/container environments, you can set INSTANCE_ID to the pod name
 * for better observability.
 */
export const INSTANCE_ID = env.INSTANCE_ID || `api-${crypto.randomUUID()}`;
