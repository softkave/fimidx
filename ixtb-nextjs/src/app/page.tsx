import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInContainerServer } from "../components/account/sign-in-container-server.tsx";
import { kAppConstants } from "../definitions/appConstants.ts";
import { kClientPaths } from "../lib/clientHelpers/clientPaths.ts";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

export default async function Page() {
  const session = await auth();
  if (session) {
    return redirect(kClientPaths.withURL(kClientPaths.app.index));
  }

  return <SignInContainerServer />;
}
