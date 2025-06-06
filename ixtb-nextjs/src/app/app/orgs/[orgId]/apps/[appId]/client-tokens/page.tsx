import { auth } from "@/auth";
import { ClientTokensPage } from "@/src/components/client-token/client-tokens-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type AppTokensPageProps = {
  params: Promise<{
    groupId: string;
    appId: string;
  }>;
};

export default async function Page(
  props: AppTokensPageProps
): Promise<JSX.Element> {
  const { groupId, appId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.group.app.clientToken.index(groupId, appId)
        )
      )
    );
  }

  return <ClientTokensPage groupId={groupId} appId={appId} />;
}
