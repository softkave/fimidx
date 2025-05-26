import { auth } from "@/auth";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { kClientPaths } from "../lib/clientHelpers/clientPaths.ts";
import { WebMain } from "../components/web/web-main.tsx";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

export default async function Page() {
  const session = await auth();
  if (session) {
    return redirect(kClientPaths.withURL(kClientPaths.app.index));
  }

  return <WebMain />;
}
