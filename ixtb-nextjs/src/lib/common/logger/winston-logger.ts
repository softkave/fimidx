import assert from "assert";
import winston from "winston";
import {
  FmLogsWinstonTransport,
  kFmLogsBaseUrl as kDefaultFmLogsBaseUrl,
} from "./fmlogs-winston-transport";

const kFmLogsClientToken = process.env.FMLOGS_CLIENT_TOKEN;
const kFmLogsorgId = process.env.FMLOGS_ORG_ID;
const kFmLogsAppId = process.env.FMLOGS_APP_ID;
const kFmLogsBaseUrl = process.env.FMLOGS_BASE_URL ?? kDefaultFmLogsBaseUrl;

assert(kFmLogsClientToken, "FMLOGS_CLIENT_TOKEN is not set");
assert(kFmLogsorgId, "FMLOGS_ORG_ID is not set");
assert(kFmLogsAppId, "FMLOGS_APP_ID is not set");
assert(kFmLogsBaseUrl, "FMLOGS_BASE_URL is not set");

export const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new FmLogsWinstonTransport({
      orgId: kFmLogsorgId,
      appId: kFmLogsAppId,
      clientToken: kFmLogsClientToken,
      baseUrl: kFmLogsBaseUrl,
    }),
  ],
});
