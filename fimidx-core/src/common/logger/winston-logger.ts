import { FimidxWinstonTransport } from "fimidx-winston-transport";
import winston from "winston";
import { fimidxLogger } from "./fimidx-logger.js";

export const fimidxWinstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new FimidxWinstonTransport({
      fimidxLogger: fimidxLogger,
    }),
  ],
});
