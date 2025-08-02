import {Request, Response} from 'express';
import {kCallbackFimidxHeaders} from 'fimidx-core/definitions/callback';
import {indexObjs} from 'fimidx-core/serverHelpers/index';
import {isString} from 'lodash-es';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {kInternalAccessKeyHeader} from '../../httpServer.js';
import {getConfig} from '../../utils/config.js';

let isProcessing = false;

export async function indexObjsEndpoint(req: Request, res: Response) {
  const config = getConfig();
  const apiKey = req.headers[kInternalAccessKeyHeader];
  const lastSuccessAt = req.headers[kCallbackFimidxHeaders.lastSuccessAt];

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
