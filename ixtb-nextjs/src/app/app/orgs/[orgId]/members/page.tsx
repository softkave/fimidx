import { auth } from "@/auth";
import { MembersPage } from "@/src/components/member/members-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type groupIdMembersPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function Page(
  props: groupIdMembersPageProps
): Promise<JSX.Element> {
  const { groupId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.group.members.index(groupId)
        )
      )
    );
  }

  return <MembersPage groupId={groupId} />;
}
