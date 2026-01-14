import type { Context, Env, MiddlewareHandler } from "hono";
import { validator } from "hono/validator";

/**
 * Custom Zod validator middleware for Hono that works with Zod v4.2+
 * This replaces @hono/zod-validator to avoid type compatibility issues
 * Uses Hono's built-in validator for proper c.req.valid() integration
 */
export function zodValidator<
  // Use a relaxed type constraint that matches Zod's safeParse structure
  // biome-ignore lint/suspicious/noExplicitAny: override handle receiving unknown
  TSchema extends { safeParse: (data: unknown) => any; _input?: any; _output?: any },
  TTarget extends "json" | "form" | "query" | "param" | "header",
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
  if (target === "json") {
    return async (c, next) => {
      let value: unknown;
      try {
        value = await c.req.json();
      } catch (error) {
        const logger = (c as Context).get?.("logger");
        logger?.warn("Invalid JSON", {
          target,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        return c.json(
          {
            success: false,
            error: "Invalid JSON",
            message: "Request body must be valid JSON",
          },
          400,
        );
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

      c.req.addValidatedData("json", result.data);
      return next();
    };
  }

  return validator(target, (value, c) => {
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

    return result.data;
  });
}
