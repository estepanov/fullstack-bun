import pino from "pino";
import { env } from "../env";

export const loggerFactory = ({
  prettyLogs,
}: {
  prettyLogs: boolean;
}) =>
  pino({
    transport: prettyLogs
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
    formatters: {
      level: (label) => {
        return {
          level: label,
        };
      },
      bindings: () => ({}),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

export const appLogger = loggerFactory({
  prettyLogs: env.NODE_ENV === "development",
});

export type AppLogger = typeof appLogger;
