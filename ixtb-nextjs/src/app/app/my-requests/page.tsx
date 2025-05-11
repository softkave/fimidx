import { auth } from "@/auth";
import { MemberRequestListPage } from "@/src/components/member/user-requests/member-request-list-page";
import { kAppConstants } from "@/src/definitions/appConstants";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

export default async function Page() {
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(kClientPaths.app.myRequests)
      )
    );
  }

  return <MemberRequestListPage />;
}
