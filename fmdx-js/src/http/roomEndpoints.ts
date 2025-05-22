import {FmdxEndpointsBase} from '../utils/FmdxEndpointsBase.js';
import type {FmdxEndpointOpts} from '../utils/types.js';
import type {
  AddRoomEndpointParams,
  AddRoomSubscriptionEndpointParams,
  DeleteRoomEndpointParams,
  GetRoomEndpointParams,
  GetRoomSubscriptionsEndpointParams,
  IAddRoomEndpointResult,
  IAddRoomSubscriptionEndpointResult,
  IGetRoomEndpointResult,
  IGetRoomSubscriptionsEndpointResult,
} from './roomTypes.js';

export class FmdxRoomsEndpoints extends FmdxEndpointsBase {
  addRoom = async (
    props?: AddRoomEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<IAddRoomEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/rooms',
        method: 'POST',
      },
      opts,
    );
  };
  deleteRoom = async (
    props?: DeleteRoomEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<void> => {
    await this.executeJson(
      {
        data: props,
        path: '/rooms',
        method: 'DELETE',
      },
      opts,
    );
  };
  getRoom = async (
    props?: GetRoomEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<IGetRoomEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/rooms/fetchOne',
        method: 'POST',
      },
      opts,
    );
  };
  addRoomSubscription = async (
    props?: AddRoomSubscriptionEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<IAddRoomSubscriptionEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/rooms/subscriptions',
        method: 'POST',
      },
      opts,
    );
  };
  getRoomSubscriptions = async (
    props?: GetRoomSubscriptionsEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<IGetRoomSubscriptionsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/rooms/subscriptions/fetch',
        method: 'POST',
      },
      opts,
    );
  };
}
