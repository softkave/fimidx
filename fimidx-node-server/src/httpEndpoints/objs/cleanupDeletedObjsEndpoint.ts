import {Request, Response} from 'express';
import {cleanupDeletedObjs} from 'fimidx-core/serverHelpers/index';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {kInternalAccessKeyHeader} from '../../httpServer.js';
import {getConfig} from '../../utils/config.js';

let isProcessing = false;

export async function cleanupDeletedObjsEndpoint(req: Request, res: Response) {
  const config = getConfig();
  const apiKey = req.headers[kInternalAccessKeyHeader];

  if (apiKey === config.internalAccessKey && !isProcessing) {
    isProcessing = true;
    kPromiseStore.callAndForget(async () => {
      await cleanupDeletedObjs();
      isProcessing = false;
    });
  }

  res.status(200).send({});
}
