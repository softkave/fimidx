import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type groupIdPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function Page(
  props: groupIdPageProps
): Promise<JSX.Element> {
  const { groupId } = await props.params;

  return redirect(
    kClientPaths.withURL(kClientPaths.app.group.app.index(groupId))
  );
}
