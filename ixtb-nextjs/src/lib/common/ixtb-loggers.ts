import {
  fimidxConsoleLogger,
  fimidxLogger,
  fimidxNextAuthLogger,
} from "fimidx-core/common/logger/index";

fimidxLogger.mergeMetadata({
  app: "ixtb-nextjs",
});

export const ixtbConsoleLogger = fimidxConsoleLogger;
export const ixtbNextAuthLogger = fimidxNextAuthLogger;
