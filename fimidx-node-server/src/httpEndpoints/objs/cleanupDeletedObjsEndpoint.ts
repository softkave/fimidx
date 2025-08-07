import {Request, Response} from 'express';
import {getCoreConfig} from 'fimidx-core/common/getCoreConfig';
import {cleanupDeletedObjs} from 'fimidx-core/serverHelpers/index';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {kInternalAccessKeyHeader} from '../../httpServer.js';

let isProcessing = false;

export async function cleanupDeletedObjsEndpoint(req: Request, res: Response) {
  const {
    fimidxInternal: {internalAccessKey},
  } = getCoreConfig();
  const apiKey = req.headers[kInternalAccessKeyHeader];

  if (apiKey === internalAccessKey && !isProcessing) {
    isProcessing = true;
    kPromiseStore.callAndForget(async () => {
      await cleanupDeletedObjs();
      isProcessing = false;
    });
  }

  res.status(200).send({});
}
