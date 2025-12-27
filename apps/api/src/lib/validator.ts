import type { Context, Env, MiddlewareHandler, ValidationTargets } from "hono";

type ValidationTarget = keyof ValidationTargets;

/**
 * Custom Zod validator middleware for Hono that works with Zod v4.2+
 * This replaces @hono/zod-validator to avoid type compatibility issues
 */
export function zodValidator<
  // Use a relaxed type constraint that matches Zod's safeParse structure
  // biome-ignore lint/suspicious/noExplicitAny: override handle receiving unknown
  TSchema extends { safeParse: (data: unknown) => any; _input?: any; _output?: any },
  TTarget extends ValidationTarget,
  E extends Env = Env,
  P extends string = string,
>(
  target: TTarget,
  schema: TSchema,
): MiddlewareHandler<
  E,
  P,
  {
    in: { [K in TTarget]: TSchema["_input"] };
    out: { [K in TTarget]: TSchema["_output"] };
  }
> {
  return async (c, next) => {
    let value: unknown;

    switch (target) {
      case "json":
        try {
          value = await c.req.json();
        } catch (error) {
          const logger = (c as Context).get?.("logger");
          logger?.warn({ error }, "Failed to parse JSON body");
          return c.json(
            {
              success: false,
              error: "Invalid JSON",
              message: "Request body must be valid JSON",
            },
            400,
          );
        }
        break;
      case "form":
        value = await c.req.parseBody();
        break;
      case "query":
        value = c.req.query();
        break;
      case "param":
        value = c.req.param();
        break;
      case "header":
        value = c.req.header();
        break;
      default:
        throw new Error(`Unsupported validation target: ${target}`);
    }

    const result = schema.safeParse(value);

    if (!result.success) {
      const logger = (c as Context).get?.("logger");
      logger?.warn("Validation failed", {
        target,
        issues: result.error?.issues || [],
      });

      return c.json(
        {
          success: false,
          error: "Validation failed",
          // biome-ignore lint/suspicious/noExplicitAny: override handle receiving unknown
          issues: (result.error?.issues || []).map((err: any) => ({
            path: Array.isArray(err.path) ? err.path.join(".") : String(err.path || ""),
            message: err.message || "Validation error",
          })),
        },
        400,
      );
    }

    // Store the validated data in the request context
    // This uses Hono's internal API pattern for storing validated data
    // biome-ignore lint/suspicious/noExplicitAny: override handle receiving unknown
    const req = c.req as unknown as Record<string, any>;
    req[target] = result.data;

    await next();
  };
}
