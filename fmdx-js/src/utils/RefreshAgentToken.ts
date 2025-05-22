import {noop} from 'lodash-es';
import {RefreshableResource} from 'softkave-js-utils';
import {kDefaultRefreshTokenTimeoutLatency} from './constants.js';

export type RefreshAgentTokenValue = {
  expiresAt: number;
  value: unknown;
};

export class RefreshAgentToken extends RefreshableResource<RefreshAgentTokenValue> {
  constructor(props: {
    token: RefreshAgentTokenValue;
    refreshFn: (
      current: RefreshAgentTokenValue,
    ) => Promise<RefreshAgentTokenValue>;
    timeoutLatency?: number;
    onError?: (error: unknown, current: RefreshAgentTokenValue) => void;
  }) {
    super({
      timeout: props.token.expiresAt
        ? props.token.expiresAt -
          (props.timeoutLatency ?? kDefaultRefreshTokenTimeoutLatency)
        : 0,
      resource: props.token,
      refreshFn: async current => {
        const response = await props.refreshFn(current);
        return response;
      },
      onRefresh: resource => {
        this.setRefreshTimeout(
          resource.expiresAt -
            (props.timeoutLatency ?? kDefaultRefreshTokenTimeoutLatency),
        ).start();
      },
      onError: (error, current) => {
        this.stop();
        (props.onError ?? noop)(error, current);
      },
    });
  }

  start() {
    if (this.timeout) {
      return super.start();
    }

    return this;
  }

  getToken() {
    return this.getValue();
  }
}
