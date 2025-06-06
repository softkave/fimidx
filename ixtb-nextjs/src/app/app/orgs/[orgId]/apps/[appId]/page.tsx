import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type groupIdAppIdPageProps = {
  params: Promise<{
    groupId: string;
    appId: string;
  }>;
};

export default async function Page(
  props: groupIdAppIdPageProps
): Promise<JSX.Element> {
  const { groupId, appId } = await props.params;

  return redirect(
    kClientPaths.withURL(kClientPaths.app.group.app.log.index(groupId, appId))
  );
}
