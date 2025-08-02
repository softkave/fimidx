import { AssertionError } from "assert";
import { OwnError, OwnServerError } from "fimidx-core/common/error";
import { NextRequest } from "next/server";
import { AnyFn, AnyObject } from "softkave-js-utils";
import { ZodError } from "zod";

export interface IRouteContext {
  params: Promise<AnyObject>;
}

export const wrapRoute =
  <TRequest extends NextRequest>(
    routeFn: AnyFn<[TRequest, IRouteContext], Promise<AnyObject | void>>
  ) =>
  async (req: TRequest, ctx: IRouteContext) => {
    try {
      let result = await routeFn(req, ctx);
      result = result || {};
      return Response.json(result, {
        status: 200,
      });
    } catch (error) {
      console.error(error);

      if (OwnServerError.isOwnServerError(error)) {
        return Response.json(
          { message: error.message, name: "OwnServerError" },
          { status: error.statusCode }
        );
      } else if (OwnError.isOwnError(error)) {
        return Response.json(
          { message: error.message, name: "OwnError" },
          { status: 500 }
        );
      } else if (error instanceof ZodError) {
        const formattedErrors = error.format();
        return Response.json(
          { message: formattedErrors, name: "ZodError" },
          { status: 400 }
        );
      } else if (error instanceof AssertionError) {
        return Response.json(
          { message: error.message, name: "AssertionError" },
          { status: 400 }
        );
      }

      return Response.json(
        { message: "Internal Server Error", name: "UnknownError" },
        { status: 500 }
      );
    }
  };
