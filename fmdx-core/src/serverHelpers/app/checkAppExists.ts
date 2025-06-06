import { first } from "lodash-es";
import { OwnServerError } from "../../common/error.js";
import { getApps } from "./getApps.js";

export async function checkAppExists(params: {
  name: string;
  isId?: string;
  groupId: string;
}) {
  const { apps } = await getApps({
    args: {
      query: {
        groupId: params.groupId,
        name: {
          eq: params.name,
        },
      },
      limit: 1,
    },
  });

  const app = first(apps);
  const isId = app && params.isId === app.id;

  return {
    exists: !!app,
    isId,
  };
}

export async function checkAppAvailable(params: {
  name: string;
  isId?: string;
  groupId: string;
}) {
  const { exists, isId } = await checkAppExists(params);

  if (exists && !isId) {
    throw new OwnServerError("App already exists", 400);
  }

  return {
    exists,
    isId,
  };
}
