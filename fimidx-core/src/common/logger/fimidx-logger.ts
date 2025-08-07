import { FimidxConsoleLikeLogger, FimidxNextAuthLogger } from "fimidx";
import { getClientConfig } from "../getClientConfig.js";

const { fimidxAppId, fimidxClientToken, nodeEnv, fimidxServerUrl } =
  getClientConfig();

export const fimidxLogger = new FimidxConsoleLikeLogger({
  appId: fimidxAppId,
  clientToken: fimidxClientToken,
  enabled: true,
  enableConsoleFallback: nodeEnv === "development",
  consoleLogOnError: true,
  logRemoteErrors: true,
  metadata: {
    app: "ixtb-nextjs",
  },
  ...(nodeEnv === "development" ? { serverURL: fimidxServerUrl } : {}),
});

export const fimidxNextAuthLogger = new FimidxNextAuthLogger(fimidxLogger);
