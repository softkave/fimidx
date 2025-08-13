import { isString } from "lodash-es";
import { OwnServerError } from "./error.js";
import { fimidxConsoleLogger } from "./logger/fimidx-console-logger.js";

export function appAssert(
  condition: unknown,
  message: unknown,
  debugInfo?: string
): asserts condition {
  if (!condition) {
    if (debugInfo) fimidxConsoleLogger.error(message, { debugInfo });
    if (message instanceof OwnServerError) throw message;
    if (isString(message)) throw new OwnServerError(message, 500);
    throw new OwnServerError(JSON.stringify(message), 500);
  }
}
