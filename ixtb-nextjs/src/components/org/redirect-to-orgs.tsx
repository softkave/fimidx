import { auth } from "@/auth";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { redirect } from "next/navigation";
import { JSX } from "react";

export async function RedirectToGroups(): Promise<JSX.Element> {
  const session = await auth();
  if (!session) {
    return redirect(
      kClientPaths.withURL(
        kClientPaths.signinWithRedirect(kClientPaths.app.group.index)
      )
    );
  }

  return redirect(kClientPaths.withURL(kClientPaths.app.group.index));
}
