import {Request, Response} from 'express';
import {ICallback, kCallbackFmdxHeaders} from 'fmdx-core/definitions/callback';
import {indexObjs} from 'fmdx-core/serverHelpers/index';
import {isString} from 'lodash-es';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {getConfig} from '../../utils/config.js';

let isProcessing = false;

export async function indexObjsEndpoint(req: Request, res: Response) {
  const config = getConfig();
  const apiKey = req.headers[config.indexObjsApiKeyHeader];
  const lastSuccessAt = req.headers[kCallbackFmdxHeaders.lastSuccessAt];
  const callback = req.body as ICallback | undefined;

  if (apiKey === config.indexObjsApiKey && !isProcessing && callback) {
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
