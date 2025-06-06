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
    groupId: string;
    appId: string;
    callbackId: string;
  }>;
};

export default async function Page(
  props: CallbackIdPageProps
): Promise<JSX.Element> {
  const { groupId, appId, callbackId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.group.app.callbacks.single(
            groupId,
            appId,
            callbackId
          )
        )
      )
    );
  }

  return <CallbackPage callbackId={callbackId} />;
}
