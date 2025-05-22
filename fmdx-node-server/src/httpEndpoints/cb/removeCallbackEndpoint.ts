import {Request, Response} from 'express';
import {z} from 'zod';
import {removeCallback} from '../../helpers/cb/removeCallback.js';
import {IHttpOutgoingSuccessResponse} from '../../types/http.js';

export const removeCallbackHttpEndpointSchema = z.object({
  id: z.string(),
});

export function removeCallbackEndpoint(req: Request, res: Response) {
  const {id} = removeCallbackHttpEndpointSchema.parse(req.body);
  removeCallback(id);
  const response: IHttpOutgoingSuccessResponse = {
    type: 'success',
  };

  res.status(200).send(response);
}
