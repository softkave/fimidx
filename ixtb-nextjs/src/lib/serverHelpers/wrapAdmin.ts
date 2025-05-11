import { NextAuthRequest } from "@/auth.ts";
import assert from "assert";
import { AnyFn, AnyObject } from "softkave-js-utils";
import { OwnServerError } from "../common/error.ts";
import { assertCheckIsAdminEmail } from "./isAdmin.ts";
import { wrapAuthenticated } from "./wrapAuthenticated.ts";
import { IRouteContext } from "./wrapRoute.ts";

export const wrapAdmin = (
  routeFn: AnyFn<[NextAuthRequest, IRouteContext], Promise<AnyObject | void>>
) =>
  wrapAuthenticated((req, ctx, session) => {
    assert.ok(session, new OwnServerError("Unauthorized", 401));
    assert.ok(
      session.user?.email,
      new OwnServerError("User email is required", 401)
    );
    assertCheckIsAdminEmail(session.user.email);
    return routeFn(req, ctx);
  });
