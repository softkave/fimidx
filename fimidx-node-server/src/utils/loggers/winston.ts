import {getCoreConfig} from 'fimidx-core/common/getCoreConfig';
import {FimidxWinstonTransport} from 'fimidx-winston-transport';
import winston from 'winston';

const {
  logger: {fimidxAppId, fimidxClientToken, fimidxServerUrl},
} = getCoreConfig();

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new FimidxWinstonTransport({
      appId: fimidxAppId,
      clientToken: fimidxClientToken,
      serverURL: fimidxServerUrl,
    }),
  ],
});
