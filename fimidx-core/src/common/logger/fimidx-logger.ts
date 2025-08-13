import { FimidxLogger } from "fimidx";
import { getClientConfig } from "../getClientConfig.js";

const { fimidxAppId, fimidxClientToken, nodeEnv, fimidxServerUrl } =
  getClientConfig();

export const fimidxLogger = new FimidxLogger({
  appId: fimidxAppId,
  clientToken: fimidxClientToken,
  consoleLogOnError: true,
  logRemoteErrors: true,
  ...(nodeEnv === "development" ? { serverURL: fimidxServerUrl } : {}),
});
