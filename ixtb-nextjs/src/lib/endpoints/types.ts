import { NextRequest } from "next/server";
import {
  IClientTokenAuthenticatedRequest,
  IMaybeAuthenticatedRequest,
  IUserAuthenticatedRequest,
} from "../serverHelpers/wrapAuthenticated";
import { IRouteContext } from "../serverHelpers/wrapRoute";

export type NextUserAuthenticatedEndpointFn<T> = (params: {
  req: NextRequest;
  ctx: IRouteContext;
  session: IUserAuthenticatedRequest;
}) => Promise<T>;

export type NextClientTokenAuthenticatedEndpointFn<T> = (params: {
  req: NextRequest;
  ctx: IRouteContext;
  session: IClientTokenAuthenticatedRequest;
}) => Promise<T>;

export type NextMaybeAuthenticatedEndpointFn<T> = (params: {
  req: NextRequest;
  ctx: IRouteContext;
  session: IMaybeAuthenticatedRequest;
}) => Promise<T>;
