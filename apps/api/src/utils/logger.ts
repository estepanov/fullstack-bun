import pino from "pino";
import { isDevelopmentEnv } from "../env";

export const loggerFactory = ({ prettyLogs }: { prettyLogs: boolean }) => {
  // In production, use a minimal logger configuration without pino-pretty
  // This avoids loading the pino-pretty dependency and reduces memory usage
  const config: pino.LoggerOptions = {
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({}),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // Only add pretty transport in development
  if (prettyLogs) {
    config.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    };
  }

  return pino(config);
};

export const appLogger = loggerFactory({
  prettyLogs: isDevelopmentEnv(),
});

export type AppLogger = typeof appLogger;
