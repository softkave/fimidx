export interface ICallbackStoreItem {
  id: string;
  handle: NodeJS.Timeout;
}

export type ICallbackStore = Record<string, ICallbackStoreItem>;

export const kCallbackStore: ICallbackStore = {};
