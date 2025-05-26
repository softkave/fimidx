import {Request, Response} from 'express';
import {z} from 'zod';
import {kCallbackStore} from '../../ctx/callback.js';
import {IHttpOutgoingSuccessResponse} from '../../types/http.js';

export const removeCallbackHttpEndpointSchema = z.object({
  id: z.string(),
});

function removeCallbackFromStore(id: string) {
  const item = kCallbackStore[id];
  delete kCallbackStore[id];
  if (item) {
    if (item.timeoutHandle) {
      clearTimeout(item.timeoutHandle);
    }
    if (item.intervalHandle) {
      clearInterval(item.intervalHandle);
    }
  }
}

export function removeCallbackEndpoint(req: Request, res: Response) {
  const {id} = removeCallbackHttpEndpointSchema.parse(req.body);
  removeCallbackFromStore(id);
  const response: IHttpOutgoingSuccessResponse = {
    type: 'success',
  };

  res.status(200).send(response);
}
