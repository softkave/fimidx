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
    orgId: string;
    memberId: string;
  }>;
};

export default async function Page(
  props: MemberIdPageProps
): Promise<JSX.Element> {
  const { orgId, memberId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.org.members.single(orgId, memberId)
        )
      )
    );
  }

  return <MemberPage orgId={orgId} memberId={memberId} />;
}
