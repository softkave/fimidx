import { auth } from "@/auth";
import { ClientTokenPage } from "@/src/components/client-token/client-token-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type ClientTokenIdPageProps = {
  params: Promise<{
    orgId: string;
    appId: string;
    clientTokenId: string;
  }>;
};

export default async function Page(
  props: ClientTokenIdPageProps
): Promise<JSX.Element> {
  const { orgId, appId, clientTokenId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.org.app.clientToken.single(
            orgId,
            appId,
            clientTokenId
          )
        )
      )
    );
  }

  return <ClientTokenPage appId={appId} clientTokenId={clientTokenId} />;
}
