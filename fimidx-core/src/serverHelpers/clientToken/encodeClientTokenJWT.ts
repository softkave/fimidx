import assert from "assert";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { isString } from "lodash-es";
import { v7 as uuidv7 } from "uuid";
import type { EncodeClientTokenJWTEndpointArgs } from "../../definitions/clientToken.js";

const kJWTSecret = process.env.FIMIDX_JWT_SECRET;
assert(isString(kJWTSecret), "FIMIDX_JWT_SECRET is not set");

export const kDefaultExpiresAtDuration = 1000 * 60 * 60 * 24 * 30; // 30 days

export function getJWTSecret() {
  assert(isString(kJWTSecret), "FIMIDX_JWT_SECRET is not set");
  return kJWTSecret;
}

export interface IEncodeClientTokenJWTContent {
  id: string;
  refreshToken?: string;
  duration?: number;
  groupId: string;
  appId: string;
}

export async function encodeClientTokenJWT(params: {
  id: string;
  groupId: string;
  appId: string;
  args: EncodeClientTokenJWTEndpointArgs;
}) {
  const { id, groupId, appId, args } = params;
  const { refresh, expiresAt: expiresAtDate } = args;

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
    groupId,
    appId,
  };

  const token = jwt.sign(
    content,
    getJWTSecret(),
    duration ? { expiresIn: `${duration}ms` } : undefined
  );

  return { token, refreshToken };
}
