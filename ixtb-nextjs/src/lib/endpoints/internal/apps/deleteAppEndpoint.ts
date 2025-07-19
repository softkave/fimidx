import { deleteAppsSchema } from "fmdx-core/definitions/app";
import { kByTypes } from "fmdx-core/definitions/other";
import { deleteApps } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../../types";

export const deleteAppEndpoint: NextUserAuthenticatedEndpointFn<void> = async (
  params
) => {
  const {
    req,
    session: { userId },
  } = params;

  const input = deleteAppsSchema.parse(await req.json());

  await deleteApps({
    query: input.query,
    deleteMany: input.deleteMany,
    by: userId,
    byType: kByTypes.user,
  });
};
