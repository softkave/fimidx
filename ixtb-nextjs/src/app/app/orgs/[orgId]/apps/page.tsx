import { auth } from "@/auth";
import { AppsPage } from "@/src/components/app/apps-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type groupIdAppsPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function Page(
  props: groupIdAppsPageProps
): Promise<JSX.Element> {
  const { groupId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.group.app.index(groupId)
        )
      )
    );
  }

  return <AppsPage groupId={groupId} />;
}
