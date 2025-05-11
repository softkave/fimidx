import { auth } from "@/auth";
import { MembersPage } from "@/src/components/member/members-page";
import { kAppConstants } from "@/src/definitions/appConstants";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

type OrgIdMembersPageProps = {
  params: Promise<{
    orgId: string;
  }>;
};

export default async function Page(
  props: OrgIdMembersPageProps
): Promise<JSX.Element> {
  const { orgId } = await props.params;
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(
          kClientPaths.app.org.members.index(orgId)
        )
      )
    );
  }

  return <MembersPage orgId={orgId} />;
}
