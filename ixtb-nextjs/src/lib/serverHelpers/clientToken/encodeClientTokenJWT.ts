import { EncodeClientTokenJWTEndpointArgs } from "@/src/definitions/clientToken";
import assert from "assert";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { isString } from "lodash-es";
import { v7 as uuidv7 } from "uuid";
import { getClientToken } from "./getClientToken";

const kJWTSecret = process.env.JWT_SECRET;
assert(isString(kJWTSecret), "JWT_SECRET is not set");

export const kDefaultExpiresAtDuration = 1000 * 60 * 60 * 24 * 30; // 30 days

export function getJWTSecret() {
  assert(isString(kJWTSecret), "JWT_SECRET is not set");
  return kJWTSecret;
}

export interface IEncodeClientTokenJWTContent {
  id: string;
  refreshToken?: string;
  duration?: number;
  orgId: string;
  appId: string;
}

export async function encodeClientTokenJWT(params: {
  id: string;
  orgId: string;
  appId: string;
  args: EncodeClientTokenJWTEndpointArgs;
}) {
  const { id, orgId, appId, args } = params;
  const { refresh, expiresAt: expiresAtDate } = args;

  await getClientToken({ id, orgId, appId });

  const refreshToken = refresh
    ? createHash("sha256").update(uuidv7()).digest("hex")
    : undefined;

  const expiresAt = expiresAtDate
    ? new Date(expiresAtDate)
    : refreshToken
    ? new Date(Date.now() + kDefaultExpiresAtDuration)
    : undefined;

  const duration = expiresAt ? expiresAt.getTime() - Date.now() : undefined;

  const content: IEncodeClientTokenJWTContent = {
    id,
    refreshToken,
    duration,
    orgId,
    appId,
  };

  const token = jwt.sign(
    content,
    getJWTSecret(),
    duration ? { expiresIn: `${duration}ms` } : undefined
  );

  return { token, refreshToken };
}
