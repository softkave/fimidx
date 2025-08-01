import {Request, Response} from 'express';
import {kCallbackFmdxHeaders} from 'fmdx-core/definitions/callback';
import {indexObjs} from 'fmdx-core/serverHelpers/index';
import {isString} from 'lodash-es';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {getConfig} from '../../utils/config.js';
import {kInternalAccessKeyHeader} from '../../httpServer.js';

let isProcessing = false;

export async function indexObjsEndpoint(req: Request, res: Response) {
  console.log('Index objs endpoint');
  const config = getConfig();
  const apiKey = req.headers[kInternalAccessKeyHeader];
  const lastSuccessAt = req.headers[kCallbackFmdxHeaders.lastSuccessAt];

  if (apiKey === config.internalAccessKey && !isProcessing) {
    isProcessing = true;
    kPromiseStore.callAndForget(async () => {
      await indexObjs({
        lastSuccessAt: isString(lastSuccessAt) ? new Date(lastSuccessAt) : null,
      });
      isProcessing = false;
    });
  }

  res.status(200).send({});
}
