import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { deleteAppSchema } from "fmdx-core/definitions/app";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  checkPermission,
  deleteApp,
  getApp,
} from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const deleteAppEndpoint: NextUserAuthenticatedEndpointFn<void> = async (
  params
) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = deleteAppSchema.parse(await req.json());

  let orgId: string | undefined;
  if (input.id) {
    const app = await getApp({ id: input.id });
    orgId = app.orgId;
  } else if (input.orgId) {
    orgId = input.orgId;
  } else {
    throw new OwnServerError(
      "Invalid request",
      kOwnServerErrorCodes.InvalidRequest
    );
  }

  assert(
    orgId,
    new OwnServerError("Invalid request", kOwnServerErrorCodes.InvalidRequest)
  );
  await checkPermission({
    userId,
    orgId,
    permission: kPermissions.app.delete,
  });

  await deleteApp(input);
};
