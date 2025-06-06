import { auth } from "@/auth";
import { GroupsPage } from "@/src/components/group/groups-page";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
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
        kClientPaths.signinWithRedirect(kClientPaths.app.group.index)
      )
    );
  }

  return <GroupsPage />;
}
