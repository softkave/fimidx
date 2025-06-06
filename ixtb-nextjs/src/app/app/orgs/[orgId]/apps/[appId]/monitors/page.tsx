import { auth } from "@/auth";
import { MonitorsPage } from "@/src/components/monitor/monitors-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type AppMonitorsPageProps = {
  params: Promise<{
    groupId: string;
    appId: string;
  }>;
};

export default async function Page(
  props: AppMonitorsPageProps
): Promise<JSX.Element> {
  const { groupId, appId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.group.app.monitors.index(groupId, appId)
        )
      )
    );
  }

  return <MonitorsPage groupId={groupId} appId={appId} />;
}
