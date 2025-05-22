import type {IRefreshAuthToken} from './types.js';

export type FmdxJsConfigAuthToken = string | IRefreshAuthToken;

export interface FmdxJsConfigOptions {
  authToken?: FmdxJsConfigAuthToken;
  serverURL?: string;
}

export class FmdxJsConfig {
  protected inheritors: FmdxJsConfig[] = [];

  constructor(
    protected config: FmdxJsConfigOptions = {},
    protected inheritConfigFrom?: FmdxJsConfig,
  ) {
    inheritConfigFrom?.registerSdkConfigInheritor(this);
  }

  setSdkAuthToken(token: FmdxJsConfigAuthToken) {
    this.setSdkConfig({authToken: token});
  }

  setSdkConfig(update: Partial<FmdxJsConfigOptions>) {
    this.config = {...this.config, ...update};
    this.fanoutSdkConfigUpdate(update);
  }

  getSdkConfig() {
    return this.config;
  }

  protected registerSdkConfigInheritor(inheritor: FmdxJsConfig) {
    this.inheritors.push(inheritor);
  }

  protected fanoutSdkConfigUpdate(update: Partial<FmdxJsConfigOptions>) {
    this.inheritors.forEach(inheritor => inheritor.setSdkConfig(update));
  }
}
