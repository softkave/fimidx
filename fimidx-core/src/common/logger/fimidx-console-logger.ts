import { FimidxConsoleLikeLogger } from "fimidx";
import { getClientConfig } from "../getClientConfig.js";
import { fimidxLogger } from "./fimidx-logger.js";

const { nodeEnv } = getClientConfig();

export const fimidxConsoleLogger = new FimidxConsoleLikeLogger({
  fimidxLogger: fimidxLogger,
  enableConsoleFallback: nodeEnv === "development",
});
