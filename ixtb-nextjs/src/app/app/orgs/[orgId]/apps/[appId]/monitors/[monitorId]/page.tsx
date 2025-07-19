import { auth } from "@/auth";
import { MonitorPage } from "@/src/components/monitor/monitor-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type MonitorIdPageProps = {
  params: Promise<{
    orgId: string;
    appId: string;
    monitorId: string;
  }>;
};

export default async function Page(
  props: MonitorIdPageProps
): Promise<JSX.Element> {
  const { orgId, appId, monitorId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.org.app.monitors.single(orgId, appId, monitorId)
        )
      )
    );
  }

  return <MonitorPage monitorId={monitorId} />;
}
