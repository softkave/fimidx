import { z } from "zod";

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
  /** The callback timeout */
  timeout: Date | number | null;
  /** The callback interval from */
  intervalFrom: Date | number | null;
  /** The callback interval ms */
  intervalMs: number | null;
  /** The callback idempotency key */
  idempotencyKey: string | null;
}

export const callbackMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
]);

export const addCallbackSchema = z.object({
  appId: z.string(),
  url: z.string().url(),
  method: callbackMethodSchema,
  requestHeaders: z.record(z.string(), z.string()).optional(),
  requestBody: z.string().optional(),
  timeout: z.string().datetime().optional(),
  intervalFrom: z.string().datetime().optional(),
  intervalMs: z.number().optional(),
  idempotencyKey: z.string().optional(),
});

export const deleteCallbackSchema = z.object({
  id: z.string().optional(),
  appId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  acknowledgeDeleteAllForApp: z.boolean().optional(),
});

export const getCallbackSchema = z.object({
  id: z.string().optional(),
  appId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const getCallbacksSchema = z.object({
  appId: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
  idempotencyKey: z.string().array().optional(),
});

export type AddCallbackEndpointArgs = z.infer<typeof addCallbackSchema>;
export type DeleteCallbackEndpointArgs = z.infer<typeof deleteCallbackSchema>;
export type GetCallbackEndpointArgs = z.infer<typeof getCallbackSchema>;
export type GetCallbacksEndpointArgs = z.infer<typeof getCallbacksSchema>;

export interface IAddCallbackEndpointResponse {
  callback: ICallback;
}

export interface IGetCallbackEndpointResponse {
  callback: ICallback;
}

export interface IGetCallbacksEndpointResponse {
  callbacks: ICallback[];
  total: number;
}
