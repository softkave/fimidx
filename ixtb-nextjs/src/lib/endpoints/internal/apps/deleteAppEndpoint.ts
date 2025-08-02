import { deleteAppsSchema } from "fimidx-core/definitions/app";
import { kByTypes } from "fimidx-core/definitions/other";
import { deleteApps } from "fimidx-core/serverHelpers/index";
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
