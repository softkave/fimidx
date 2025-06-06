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

  let groupId: string | undefined;
  if (input.id) {
    const app = await getApp({ id: input.id });
    groupId = app.groupId;
  } else if (input.groupId) {
    groupId = input.groupId;
  } else {
    throw new OwnServerError(
      "Invalid request",
      kOwnServerErrorCodes.InvalidRequest
    );
  }

  assert(
    groupId,
    new OwnServerError("Invalid request", kOwnServerErrorCodes.InvalidRequest)
  );
  await checkPermission({
    userId,
    groupId,
    permission: kPermissions.app.delete,
  });

  await deleteApp(input);
};
