import { auth } from "@/auth";
import { SignInContainerClient } from "@/src/components/account/sign-in-container-client.tsx";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths.ts";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { JSX } from "react";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

export default async function SigninPage(): Promise<JSX.Element> {
  const session = await auth();
  if (session) {
    return redirect(kClientPaths.withURL(kClientPaths.app.index));
  }

  return <SignInContainerClient />;
}
