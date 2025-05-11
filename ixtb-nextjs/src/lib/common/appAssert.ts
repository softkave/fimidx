import { isString } from "lodash-es";
import { OwnServerError } from "./error";

export function appAssert(
  condition: unknown,
  message: unknown,
  debugInfo?: string
): asserts condition {
  if (!condition) {
    if (debugInfo) console.error(debugInfo);
    if (message instanceof OwnServerError) throw message;
    if (isString(message)) throw new OwnServerError(message, 500);
    throw new OwnServerError(JSON.stringify(message), 500);
  }
}
