import {Request, Response} from 'express';
import {ICallback} from 'fmdx-core/definitions/callback';
import {cleanupDeletedObjs} from 'fmdx-core/serverHelpers/index';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {getConfig} from '../../utils/config.js';

let isProcessing = false;

export async function cleanupDeletedObjsEndpoint(req: Request, res: Response) {
  const config = getConfig();
  const apiKey = req.headers[config.cleanupObjsApiKeyHeader];
  const callback = req.body as ICallback | undefined;

  if (apiKey === config.cleanupObjsApiKey && !isProcessing && callback) {
    isProcessing = true;
    kPromiseStore.callAndForget(async () => {
      await cleanupDeletedObjs();
      isProcessing = false;
    });
  }

  res.status(200).send({});
}
