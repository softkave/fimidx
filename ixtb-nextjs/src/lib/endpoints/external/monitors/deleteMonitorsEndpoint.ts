import { deleteMonitorsSchema } from "fmdx-core/definitions/monitor";
import { deleteMonitors } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const deleteMonitorsEndpoint: NextMaybeAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { getBy },
  } = params;

  const input = deleteMonitorsSchema.parse(await req.json());
  await deleteMonitors({
    ...input,
    by: getBy().by,
    byType: getBy().byType,
  });
};
