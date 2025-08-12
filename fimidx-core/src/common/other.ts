import type { AnyObject } from "softkave-js-utils";

export function tryParseJson(str: string | null): AnyObject | null {
  if (!str) {
    return null;
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
