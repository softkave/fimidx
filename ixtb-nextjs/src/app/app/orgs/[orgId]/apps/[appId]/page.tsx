import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type orgIdAppIdPageProps = {
  params: Promise<{
    orgId: string;
    appId: string;
  }>;
};

export default async function Page(
  props: orgIdAppIdPageProps
): Promise<JSX.Element> {
  const { orgId, appId } = await props.params;

  return redirect(
    kClientPaths.withURL(kClientPaths.app.org.app.log.index(orgId, appId))
  );
}
