import {z} from 'zod';

export interface ICallback {
  id: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  orgId: string;
  appId: string;
  clientTokenId: string;
  /** The callback URL */
  url: string;
  /** The callback HTTP method */
  method: string;
  /** The callback headers */
  requestHeaders: Record<string, string> | null;
  /** The callback body */
  requestBody: string | null;
  /** The callback error */
  error: string | null;
  /** The callback response headers */
  responseHeaders: Record<string, string> | null;
  /** The callback response body */
  responseBody: string | null;
  /** The callback response status code */
  responseStatusCode: number | null;
  /** The callback executed at */
  executedAt: number | Date | null;
}

export const callbackMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
]);

export const addCallbackSchema = z.object({
  appId: z.string(),
  url: z.string().url(),
  method: callbackMethodSchema,
  requestHeaders: z.record(z.string(), z.string()).optional(),
  requestBody: z.string().optional(),
  timeout: z.string().datetime(),
});

export const deleteCallbackSchema = z.object({
  id: z.string(),
});

export type AddCallbackEndpointParams = z.infer<typeof addCallbackSchema>;
export type DeleteCallbackEndpointParams = z.infer<typeof deleteCallbackSchema>;

export interface IAddCallbackEndpointResult {
  callback: ICallback;
}
