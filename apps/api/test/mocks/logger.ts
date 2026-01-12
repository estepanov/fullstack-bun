import pino from "pino";
import type { AppLogger } from "../../src/utils/logger";

export const testLogger: AppLogger = pino();
