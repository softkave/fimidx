import assert from 'assert';
import {FimidxWinstonTransport} from 'fimidx-winston-transport';
import winston from 'winston';

const kFimidxClientToken = process.env.FIMIDX_CLIENT_TOKEN;
const kFimidxAppId = process.env.FIMIDX_APP_ID;
const kFimidxServerURL = process.env.FIMIDX_SERVER_URL;

assert(kFimidxClientToken, 'FIMIDX_CLIENT_TOKEN is not set');
assert(kFimidxAppId, 'FIMIDX_APP_ID is not set');

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new FimidxWinstonTransport({
      appId: kFimidxAppId,
      clientToken: kFimidxClientToken,
      serverURL: kFimidxServerURL,
    }),
  ],
});
