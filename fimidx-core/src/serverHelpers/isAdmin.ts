import assert from "assert";
import { OwnServerError } from "../common/error.js";
import { getCoreConfig } from "../common/getCoreConfig.js";

const { adminEmails: adminEmailsConfig } = getCoreConfig();

export function checkIsAdminEmail(email?: string | null) {
  assert.ok(email, "Email is required");
  return adminEmailsConfig && adminEmailsConfig.includes(email);
}

export function assertCheckIsAdminEmail(email: string) {
  assert.ok(checkIsAdminEmail(email), new OwnServerError("Access denied", 403));
}
