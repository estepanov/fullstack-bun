export const ensureTestEnv = () => {
  process.env.NODE_ENV ||= "test";
  process.env.PORT ||= "0";
  process.env.CORS_ALLOWLISTED_ORIGINS ||= "http://localhost:5173";
  process.env.API_BASE_URL ||= "http://localhost:3001";
  process.env.FE_BASE_URL ||= "http://localhost:5173";
  process.env.BETTER_AUTH_SECRET ||= "test-secret-test-secret-test-secret-123";
  process.env.DATABASE_URL ||= "postgresql://postgres:postgres@127.0.0.1:5432/mydatabase";
  process.env.REDIS_URL ||= "redis://:redispassword@127.0.0.1:6379";
  process.env.ENABLE_DISTRIBUTED_CHAT = "false";
};
