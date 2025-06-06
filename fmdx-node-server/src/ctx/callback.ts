import {
  AddCallbackEndpointArgs,
  ICallback,
} from 'fmdx-core/definitions/callback';
import {AnyFn} from 'softkave-js-utils';

export interface ICallbackStoreItem {
  id: string;
  timeoutHandle?: NodeJS.Timeout;
  intervalHandle?: NodeJS.Timeout;
}

export type ICallbackStore = Record<string, ICallbackStoreItem>;

export const kCallbackStore: ICallbackStore = {};
export const kAddCallbackQueue: Array<{
  groupId: string;
  clientTokenId: string;
  item: AddCallbackEndpointArgs;
  resolve: AnyFn<[ICallback]>;
  reject: AnyFn<[unknown]>;
  fmdxIdempotencyKey: string;
}> = [];
