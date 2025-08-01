import {Request, Response} from 'express';
import {getObjModel} from 'fmdx-core/db/fmdx.mongo';
import {deleteCallbacksSchema, ICallback} from 'fmdx-core/definitions/callback';
import {kObjTags} from 'fmdx-core/definitions/obj';
import {deleteCallbacks} from 'fmdx-core/serverHelpers/index';
import {z} from 'zod';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {removeCallbackFromStore} from '../../helpers/cb/removeCallbackFromStore.js';
import {IHttpOutgoingSuccessResponse} from '../../types/http.js';

export const removeCallbackHttpEndpointSchema = deleteCallbacksSchema.extend({
  clientTokenId: z.string(),
});

async function cleanupDeletedCallbacks(params: {fromDate: Date; toDate: Date}) {
  let batch: Pick<ICallback, 'id'>[] = [];
  let page = 0;
  const batchSize = 100;

  do {
    batch = await getObjModel()
      .find({
        tag: kObjTags.callback,
        createdAt: {
          $gte: params.fromDate,
          $lte: params.toDate,
        },
        deletedAt: {
          $exists: true,
        },
      })
      .limit(batchSize)
      .skip(page * batchSize)
      .projection({
        id: 1,
      })
      .lean();

    batch.forEach(item => {
      removeCallbackFromStore(item.id);
    });

    page++;
  } while (batch.length > 0);
}

export async function deleteCallbacksEndpoint(req: Request, res: Response) {
  const input = removeCallbackHttpEndpointSchema.parse(req.body);

  const fromDate = new Date();
  await deleteCallbacks({
    ...input,
    clientTokenId: input.clientTokenId,
  });
  const toDate = new Date();

  kPromiseStore.callAndForget(() =>
    cleanupDeletedCallbacks({
      fromDate,
      toDate,
    }),
  );

  const response: IHttpOutgoingSuccessResponse = {
    type: 'success',
  };

  res.status(200).send(response);
}
