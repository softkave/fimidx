import {Request, Response} from 'express';
import {z} from 'zod';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {fanoutMessage} from '../../helpers/ws/fanoutMessage.js';
import {IHttpOutgoingSuccessResponse} from '../../types/http.js';

export const sendMessageHttpEndpointSchema = z.object({
  messageId: z.string(),
});

export function sendMessageEndpoint(req: Request, res: Response) {
  const {messageId} = sendMessageHttpEndpointSchema.parse(req.body);
  kPromiseStore.callAndForget(() => fanoutMessage({messageId}));
  const response: IHttpOutgoingSuccessResponse = {
    type: 'success',
  };

  res.status(200).send(response);
}
