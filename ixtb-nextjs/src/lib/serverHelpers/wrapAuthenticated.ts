import { auth, NextAuthRequest } from "@/auth";
import { IClientToken } from "@/src/definitions/clientToken.ts";
import assert from "assert";
import jwt from "jsonwebtoken";
import { isString } from "lodash-es";
import { Session } from "next-auth";
import { NextRequest } from "next/server";
import { AnyFn, AnyObject } from "softkave-js-utils";
import { OwnServerError } from "../common/error.ts";
import {
  getJWTSecret,
  IEncodeClientTokenJWTContent,
} from "./clientToken/encodeClientTokenJWT.ts";
import { getClientToken } from "./clientToken/getClientToken.ts";
import { IRouteContext, wrapRoute } from "./wrapRoute.ts";

export interface IAuthenticatedRequest {
  session: Session;
  userId: string;
  email: string;
  user: Session["user"];
}

export interface IClientTokenAuthenticatedRequest {
  clientToken: IClientToken;
  jwtContent: IEncodeClientTokenJWTContent;
  checkOrgId: (orgId: string) => void;
}

type RouteFn = AnyFn<[NextAuthRequest, IRouteContext], Promise<Response>>;

const authFn = auth as unknown as AnyFn<[RouteFn], RouteFn>;

export const wrapAuthenticated = (
  routeFn: AnyFn<
    [NextAuthRequest, IRouteContext, IAuthenticatedRequest],
    Promise<void | AnyObject>
  >
) =>
  authFn(
    wrapRoute(async (req: NextAuthRequest, ctx: IRouteContext) => {
      assert.ok(req.auth, new OwnServerError("Unauthorized", 401));
      const session = req.auth;
      assert.ok(session, new OwnServerError("Unauthorized", 401));
      assert.ok(session.user, new OwnServerError("Unauthorized", 401));
      assert.ok(session.user.id, new OwnServerError("Unauthorized", 401));
      assert.ok(session.user.email, new OwnServerError("Unauthorized", 401));

      return routeFn(req, ctx, {
        session,
        userId: session.user.id,
        email: session.user.email,
        user: session.user,
      });
    })
  );

export const wrapMaybeAuthenticated = (
  routeFn: AnyFn<
    [NextAuthRequest, IRouteContext, IAuthenticatedRequest | null],
    Promise<void | AnyObject>
  >
) =>
  authFn(
    wrapRoute(async (req: NextAuthRequest, ctx: IRouteContext) => {
      const session = req.auth;
      let authenticatedRequest: IAuthenticatedRequest | null = null;

      if (session) {
        assert.ok(session, new OwnServerError("Unauthorized", 401));
        assert.ok(session.user, new OwnServerError("Unauthorized", 401));
        assert.ok(session.user.id, new OwnServerError("Unauthorized", 401));
        assert.ok(session.user.email, new OwnServerError("Unauthorized", 401));
        authenticatedRequest = {
          session,
          userId: session.user.id,
          email: session.user.email,
          user: session.user,
        };
      }

      return routeFn(req, ctx, authenticatedRequest);
    })
  );

export const wrapClientTokenAuthenticated = (
  routeFn: AnyFn<
    [NextRequest, IRouteContext, IClientTokenAuthenticatedRequest],
    Promise<void | AnyObject>
  >
) => {
  return wrapRoute(async (req: NextRequest, ctx: IRouteContext) => {
    const rawToken = req.headers.get("authorization");
    const inputToken = rawToken?.startsWith("Bearer ")
      ? rawToken.slice(7)
      : rawToken;

    assert(isString(inputToken), new OwnServerError("Unauthorized", 401));

    try {
      const decodedToken = jwt.verify(
        inputToken,
        getJWTSecret()
      ) as IEncodeClientTokenJWTContent;

      const clientToken = await getClientToken({
        id: decodedToken.id,
        orgId: decodedToken.orgId,
        appId: decodedToken.appId,
      });

      return routeFn(req, ctx, {
        clientToken,
        jwtContent: decodedToken,
        checkOrgId: (orgId: string) => {
          assert.ok(
            orgId === clientToken.orgId,
            new OwnServerError("Unauthorized", 401)
          );
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new OwnServerError("Unauthorized", 401);
      }

      throw error;
    }
  });
};
