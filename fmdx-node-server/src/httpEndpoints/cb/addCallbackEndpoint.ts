import {Request, Response} from 'express';
import {z} from 'zod';
import {addCallback} from '../../helpers/cb/addCallback.js';
import {IHttpOutgoingSuccessResponse} from '../../types/http.js';

const addCallbackHttpEndpointSchema = z.object({
  id: z.string(),
  timeout: z.string().datetime(),
});

export function addCallbackEndpoint(req: Request, res: Response) {
  console.log('addCallbackEndpoint', req);
  console.log('addCallbackEndpoint', req.body);
  const {id, timeout} = addCallbackHttpEndpointSchema.parse(req.body);
  addCallback({id, timeoutDate: new Date(timeout)});
  const response: IHttpOutgoingSuccessResponse = {
    type: 'success',
  };

  res.status(200).send(response);
}
