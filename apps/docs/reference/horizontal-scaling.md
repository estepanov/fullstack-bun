---
layout: doc
---

# Horizontal Scaling Guide

This document describes how to run and operate the API in a horizontally scaled configuration using Redis pub/sub.

## Overview

The API supports horizontal scaling across multiple instances for high availability and increased capacity. When enabled, WebSocket connections can be distributed across multiple servers while maintaining seamless communication between all clients.

### Architecture

```
┌─────────────┐
│Load Balancer│
└──────┬──────┘
       │
   ┌───┴────┬─────────┬─────────┐
   │        │         │         │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│API 1│  │API 2│  │API 3│  │API 4│
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   │        │         │         │
   └────────┴────┬────┴─────────┘
                 │
          ┌──────▼──────┐
          │    Redis    │
          │  Pub/Sub +  │
          │  Presence   │
          └─────────────┘
```

## Quick Start

### Enable Distributed Mode

Set the environment variable:

```bash
ENABLE_DISTRIBUTED_CHAT=true
```

### Optional: Set Instance ID

By default, each instance generates a unique ID. For better observability, set a custom ID:

```bash
INSTANCE_ID=api-pod-1
```

### Configure Metrics Authentication

The `/metrics` endpoint is **protected** and requires authentication. You can access it via:

1. **Admin user session** (logged in as admin)
2. **API key** (recommended for monitoring tools)

To use an API key, generate and set it:

```bash
# Generate a secure API key (min 32 characters)
METRICS_API_KEY=$(openssl rand -base64 32)

# Or use a UUID
METRICS_API_KEY=$(uuidgen)

# Add to your environment
export METRICS_API_KEY=your-generated-key
```

**Access metrics with the API key:**
```bash
curl -H "Authorization: Bearer YOUR_METRICS_API_KEY" https://api.yourdomain.com/metrics
```

### Example: Docker Compose

```yaml
version: "3.8"
services:
  api-1:
    image: your-api:latest
    environment:
      - ENABLE_DISTRIBUTED_CHAT=true
      - INSTANCE_ID=api-1
      - REDIS_URL=redis://redis:6379
      - METRICS_API_KEY=${METRICS_API_KEY}
    ports:
      - "3001:3001"
    depends_on:
      - redis

  api-2:
    image: your-api:latest
    environment:
      - ENABLE_DISTRIBUTED_CHAT=true
      - INSTANCE_ID=api-2
      - REDIS_URL=redis://redis:6379
      - METRICS_API_KEY=${METRICS_API_KEY}
    ports:
      - "3002:3001"
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Features

### 1. Cross-Instance WebSocket Broadcasting

All WebSocket messages are broadcast across all instances via Redis pub/sub:
- Chat messages
- Message deletions
- Message updates
- User disconnections
- Presence updates

### 2. Shared Presence Tracking

User presence (guest/member/admin counts) is tracked in Redis and automatically synchronized across instances.

### 3. Graceful Shutdown

When an instance receives `SIGTERM` or `SIGINT`:
1. Health checks return `503` (removed from load balancer)
2. WebSocket clients are notified
3. Connections are gracefully closed
4. Presence data is cleaned up
5. Instance is removed from cluster registry

### 4. Instance Heartbeat

Each instance sends a heartbeat to Redis every 10 seconds. Dead instances are automatically detected and cleaned up after 45 seconds of inactivity.

### 5. Message Deduplication

Messages are deduplicated using a 5-second sliding window to prevent duplicate broadcasts during retries.

## Monitoring

### Metrics Endpoint

The `/metrics` endpoint provides detailed observability into your distributed cluster.

**Authentication Required:**
- Admin session (logged in as admin user), OR
- API key via `Authorization: Bearer <key>` header

**Access metrics:**
```bash
# With API key
curl -H "Authorization: Bearer YOUR_METRICS_API_KEY" https://api.yourdomain.com/metrics

# Or as logged-in admin user (with session cookie)
curl -b cookies.txt https://api.yourdomain.com/metrics
```

**Response format:**

```json
{
  "timestamp": "2024-01-10T12:00:00.000Z",
  "instanceId": "api-1",
  "distributedMode": true,
  "pubsub": {
    "messagesPublished": 1523,
    "messagesReceived": 3046,
    "publishFailures": 0,
    "averageLatencyMs": 4.23,
    "maxLatencyMs": 45,
    "isDegraded": false,
    "uptime": 3600000
  },
  "chat": {
    "connectedClients": 123
  },
  "cluster": {
    "activeInstances": 3,
    "instances": [
      {
        "instanceId": "api-1",
        "startedAt": 1704888000000,
        "lastHeartbeat": 1704891600000,
        "connectedClients": 123
      },
      {
        "instanceId": "api-2",
        "startedAt": 1704888000000,
        "lastHeartbeat": 1704891600000,
        "connectedClients": 145
      },
      {
        "instanceId": "api-3",
        "startedAt": 1704888000000,
        "lastHeartbeat": 1704891600000,
        "connectedClients": 98
      }
    ]
  }
}
```

### Key Metrics to Monitor

**Pub/Sub Health:**
- `publishFailures` - Should be 0 or near-0
- `averageLatencyMs` - Should be <50ms
- `isDegraded` - Should be false

**Cluster Health:**
- `activeInstances` - Should match expected replica count
- `lastHeartbeat` - Should be <10 seconds old

**Alerts to Configure:**
- Pub/sub publish failures >10 in 1 minute
- Average latency >100ms for >5 minutes
- Degraded mode active
- Instance count mismatch
- Missing heartbeat >30 seconds

## Redis Requirements

### Connection Limits

Each instance requires 3 Redis connections:
- 1 for data operations
- 1 for pub/sub publishing
- 1 for pub/sub subscribing

**Example:** 10 instances = 30 Redis connections

Ensure your Redis `maxclients` setting accommodates this:

```redis
# In redis.conf
maxclients 10000
```

### Memory Usage

**Per instance:**
- Presence data: ~100 bytes × unique users
- Instance heartbeat: ~200 bytes
- Pub/sub overhead: Minimal (messages not stored)

**Example:** 1000 concurrent users across 10 instances:
- Presence: ~100 KB
- Heartbeats: ~2 KB
- Total: <200 KB

### Recommended Settings

```redis
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
maxclients 10000
timeout 300
tcp-keepalive 60
```

### Redis ACLs (Optional)

For security, create a dedicated user:

```redis
ACL SETUSER api-chat on >your-password \
  ~chat:* \
  +@all \
  -@dangerous
```

Then use:
```bash
REDIS_URL=redis://api-chat:your-password@redis:6379
```

## Troubleshooting

### Issue: Messages Not Broadcasting

**Symptoms:** Messages only visible to users on same instance

**Checks:**
1. Verify `ENABLE_DISTRIBUTED_CHAT=true` on all instances
2. Check Redis connectivity: `redis-cli ping`
3. Review pub/sub metrics: `GET /metrics` (requires auth)
4. Check for pub/sub failures in logs

**Solution:**
```bash
# Check Redis pub/sub
redis-cli
> PUBSUB CHANNELS chat:*
# Should show: chat:pubsub:global:broadcast, etc.

> PUBSUB NUMSUB chat:pubsub:global:broadcast
# Should show number of subscribers
```

### Issue: Presence Counts Incorrect

**Symptoms:** User counts don't match reality

**Checks:**
1. Check for dead instances: `GET /metrics` (requires auth) → `cluster.instances`
2. Verify presence pruning is working
3. Check Redis sorted sets:

```bash
redis-cli
> ZCARD chat:presence:global:members
> ZRANGE chat:presence:global:members 0 -1 WITHSCORES
```

**Solution:**
```bash
# Manual cleanup if needed
redis-cli
> DEL chat:presence:global:guests
> DEL chat:presence:global:members
> DEL chat:presence:global:admins
# Presence will rebuild automatically
```

### Issue: High Pub/Sub Latency

**Symptoms:** `averageLatencyMs` >100ms

**Checks:**
1. Redis network latency
2. Redis CPU usage
3. Redis memory usage
4. Number of connected instances

**Solution:**
- Scale Redis (use cluster or increase resources)
- Reduce debounce interval (increase Redis load)
- Check network between instances and Redis

### Issue: Instance Not Appearing in Cluster

**Symptoms:** Instance missing from `GET /metrics` cluster list

**Checks:**
1. Verify instance can reach Redis
2. Check instance logs for heartbeat errors
3. Verify instance ID is unique

**Solution:**
```bash
# Check Redis for instance keys
redis-cli
> KEYS chat:instances:*
> TTL chat:instances:api-1
# Should show ~30 seconds
```

### Issue: Degraded Mode Active

**Symptoms:** `pubsub.isDegraded: true`

**Cause:** Redis connection lost

**Solution:**
1. Check Redis availability
2. Review Redis connection errors in logs
3. Instance will auto-reconnect when Redis is available
4. Monitor `isDegraded` - should return to `false`

## Performance Tuning

### Presence Update Debouncing

Presence updates are debounced to 500ms to reduce Redis load. To adjust:

```typescript
// In src/lib/chat-manager.ts
private readonly presenceDebounceMs = 500; // Increase to reduce Redis load
```

### Heartbeat Interval

Heartbeats sent every 10 seconds. To adjust:

```typescript
// In src/lib/instance-heartbeat.ts
private readonly heartbeatIntervalMs = 10_000; // Increase to reduce Redis load
```

### Message Deduplication Window

Messages deduplicated within 5 seconds. To adjust:

```typescript
// In src/lib/chat-pubsub.ts (isDuplicateMessage method)
setTimeout(() => {
  this.recentMessageIds.delete(messageId);
}, 5000); // Adjust window size
```

## Deployment Strategies

### Blue-Green Deployment

1. Deploy new version (blue) with `ENABLE_DISTRIBUTED_CHAT=false`
2. Verify health checks pass
3. Enable distributed mode on blue instances
4. Shift traffic from green to blue
5. Shutdown green instances gracefully

### Canary Deployment

1. Deploy 1 instance with new version
2. Monitor metrics for issues
3. Gradually increase replica count
4. Rollback if issues detected

### Rolling Update

```yaml
# Kubernetes deployment strategy
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

Ensures zero downtime with graceful shutdown.

## Rollback Procedure

### Emergency Rollback

If distributed mode causes issues:

```bash
# Option 1: Disable distributed mode
kubectl set env deployment/api ENABLE_DISTRIBUTED_CHAT=false
kubectl rollout restart deployment/api

# Option 2: Scale to single instance
kubectl scale deployment/api --replicas=1
```

### Planned Rollback

1. Set `ENABLE_DISTRIBUTED_CHAT=false`
2. Perform rolling restart
3. Verify single-instance mode working
4. Scale down to 1 replica if needed

## Redis Failover

### Redis Master Failover

The API automatically reconnects to Redis when connection is lost:
- Pub/sub enters **degraded mode** (local broadcasts only)
- Presence tracking pauses
- Chat messages still saved (if Redis comes back)
- Auto-recovers when Redis is available

### Redis Cluster Mode

To use Redis Cluster:

```typescript
// In src/lib/redis.ts
export const createRedisClient = (name = "Redis"): Redis => {
  return new Redis.Cluster([
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 },
  ], {
    // ... existing config
  });
};
```

## Testing Horizontal Scaling

### Local Testing

```bash
# Terminal 1
ENABLE_DISTRIBUTED_CHAT=true PORT=3001 INSTANCE_ID=api-1 bun run dev

# Terminal 2
ENABLE_DISTRIBUTED_CHAT=true PORT=3002 INSTANCE_ID=api-2 bun run dev

# Terminal 3
ENABLE_DISTRIBUTED_CHAT=true PORT=3003 INSTANCE_ID=api-3 bun run dev
```

Connect WebSocket clients to different ports and verify messages broadcast across all.

### Load Testing

Use [k6](https://k6.io/) or [Artillery](https://artillery.io/):

```javascript
// artillery-config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
  ws:
    url: 'ws://localhost:3001/chat'

scenarios:
  - engine: ws
    flow:
      - send:
          message: '{"type":"ping"}'
      - think: 5
```

Run across multiple instances and verify message delivery.

## Security Considerations

### Metrics Endpoint Security

The `/metrics` endpoint is **protected by authentication** to prevent unauthorized access to sensitive infrastructure information.

**Why metrics are protected:**
- Exposes instance IDs and cluster topology
- Shows connected client counts and activity patterns
- Reveals pub/sub performance metrics and system health
- Could be used for reconnaissance by attackers

**Two authentication methods:**

1. **Admin Session** (for manual checks)
   - User must be authenticated and have admin role
   - Good for ad-hoc debugging and monitoring

2. **API Key** (for monitoring tools)
   - Set `METRICS_API_KEY` environment variable (min 32 chars)
   - Use `Authorization: Bearer <key>` header
   - Recommended for Prometheus, Grafana, Datadog, etc.
   - Rotate the key regularly

**Generate secure API key:**
```bash
# Option 1: OpenSSL (recommended)
METRICS_API_KEY=$(openssl rand -base64 32)

# Option 2: UUID
METRICS_API_KEY=$(uuidgen)
```

**Best practices:**
- Always set `METRICS_API_KEY` in production
- Store the key in secrets management (not in git)
- Rotate the key every 90 days
- Use HTTPS to protect the key in transit
- Monitor failed authentication attempts

### Redis Network Isolation

- Use private network for Redis
- Don't expose Redis port publicly
- Use TLS for Redis connections in production

### Instance Authentication

Instances authenticate via Redis connection string. Ensure:
- Use strong Redis password
- Rotate credentials regularly
- Use Redis ACLs to limit permissions

### Pub/Sub Message Validation

All pub/sub messages are validated:
- Structure validation
- Instance ID sanitization
- Type checking

Malformed messages are logged and dropped.

## Summary

With distributed mode enabled, your API can:
- ✅ Scale horizontally across multiple instances
- ✅ Handle WebSocket connections on any instance
- ✅ Broadcast messages to all connected clients
- ✅ Track presence across the cluster
- ✅ Gracefully shutdown without dropping connections
- ✅ Auto-recover from Redis connection issues
- ✅ Detect and clean up dead instances
- ✅ Secure monitoring via authenticated `/metrics` endpoint

**Important:** Set `METRICS_API_KEY` in production to secure the `/metrics` endpoint and enable monitoring tools (Prometheus, Grafana, etc.) to access cluster health data.
