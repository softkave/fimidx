import assert from "assert";
import { OwnServerError } from "../common/error.js";

const adminEnvRaw = process.env.ADMIN_EMAILS;
assert.ok(adminEnvRaw, "ADMIN_EMAILS must be set");
export const adminEmails = adminEnvRaw.split(",").map((email) => email.trim());

export function checkIsAdminEmail(email?: string | null) {
  assert.ok(email, "Email is required");
  return adminEmails.includes(email);
}

export function assertCheckIsAdminEmail(email: string) {
  assert.ok(checkIsAdminEmail(email), new OwnServerError("Access denied", 403));
}
