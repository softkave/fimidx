import { auth } from "@/auth";
import { LogsPage } from "@/src/components/log/logs-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fimidx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type AppLogsPageProps = {
  params: Promise<{
    orgId: string;
    appId: string;
  }>;
};

export default async function Page(
  props: AppLogsPageProps
): Promise<JSX.Element> {
  const { orgId, appId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.org.app.log.index(orgId, appId)
        )
      )
    );
  }

  return <LogsPage orgId={orgId} appId={appId} />;
}
