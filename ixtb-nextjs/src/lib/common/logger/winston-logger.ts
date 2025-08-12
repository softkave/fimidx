import { FimidxWinstonTransport } from "fimidx-winston-transport";
import winston from "winston";
import { getClientConfig } from "../getClientConfig";

const { fimidxAppId, fimidxClientToken, nodeEnv, fimidxServerUrl } =
  getClientConfig();

export const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new FimidxWinstonTransport({
      appId: fimidxAppId,
      clientToken: fimidxClientToken,
      consoleLogOnError: true,
      logRemoteErrors: true,
      metadata: {
        app: "ixtb-nextjs",
      },
      ...(nodeEnv === "development" ? { serverURL: fimidxServerUrl } : {}),
    }),
  ],
});
