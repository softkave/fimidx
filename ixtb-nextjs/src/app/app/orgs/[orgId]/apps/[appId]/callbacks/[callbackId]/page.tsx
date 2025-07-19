import { auth } from "@/auth";
import { CallbackPage } from "@/src/components/callback/callback-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type CallbackIdPageProps = {
  params: Promise<{
    orgId: string;
    appId: string;
    callbackId: string;
  }>;
};

export default async function Page(
  props: CallbackIdPageProps
): Promise<JSX.Element> {
  const { orgId, appId, callbackId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.org.app.callbacks.single(orgId, appId, callbackId)
        )
      )
    );
  }

  return <CallbackPage callbackId={callbackId} />;
}
