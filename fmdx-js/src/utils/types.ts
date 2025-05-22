import type {AxiosProgressEvent} from 'axios';
import type {Readable} from 'stream';

export type FmdxEndpointHeaders = {
  [key: string]: string | string[] | number | boolean | null;
};

export type FmdxEndpointResultWithBinaryResponse<
  TResponseType extends 'blob' | 'stream',
> = TResponseType extends 'blob'
  ? Blob
  : TResponseType extends 'stream'
  ? Readable
  : unknown;

export type FmdxEndpointProgressEvent = AxiosProgressEvent;

export type FmdxEndpointParamsRequired<T> = {
  body: T;
  serverURL?: string;
  authToken?: string;

  /** **NOTE**: doesn't work in Node.js at the moment. */
  onUploadProgress?: (progressEvent: FmdxEndpointProgressEvent) => void;
  /** **NOTE**: doesn't work in Node.js at the moment. */
  onDownloadProgress?: (progressEvent: FmdxEndpointProgressEvent) => void;
};

export type FmdxEndpointOpts = {
  serverURL?: string;
  authToken?: string;
};

export type FmdxEndpointUploadBinaryOpts = FmdxEndpointOpts & {
  /** **NOTE**: doesn't work in Node.js at the moment. */
  onUploadProgress?: (progressEvent: FmdxEndpointProgressEvent) => void;
};

export type FmdxEndpointDownloadBinaryOpts<
  TResponseType extends 'blob' | 'stream',
> = FmdxEndpointOpts & {
  responseType: TResponseType;
  /** **NOTE**: doesn't work in Node.js at the moment. */
  onDownloadProgress?: (progressEvent: FmdxEndpointProgressEvent) => void;
};

export type FmdxEndpointWithBinaryResponseParamsRequired<
  T,
  TResponseType extends 'blob' | 'stream',
> = FmdxEndpointParamsRequired<T> & {
  responseType: TResponseType;
};

export type FmdxEndpointParamsOptional<T> = Partial<
  FmdxEndpointParamsRequired<T>
>;

export type FmdxEndpointWithBinaryResponseParamsOptional<
  T,
  TResponseType extends 'blob' | 'stream',
> = FmdxEndpointParamsOptional<T> & {
  responseType: TResponseType;
};

export interface IRefreshAuthToken {
  getJwtToken(): string | undefined;
}
