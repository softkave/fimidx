import { auth } from "@/auth";
import { MemberPage } from "@/src/components/member/member-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type MemberIdPageProps = {
  params: Promise<{
    groupId: string;
    memberId: string;
  }>;
};

export default async function Page(
  props: MemberIdPageProps
): Promise<JSX.Element> {
  const { groupId, memberId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.group.members.single(groupId, memberId)
        )
      )
    );
  }

  return <MemberPage groupId={groupId} memberId={memberId} />;
}
