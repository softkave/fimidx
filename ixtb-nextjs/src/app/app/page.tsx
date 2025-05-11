import { kAppConstants } from "@/src/definitions/appConstants";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

export default function Page() {
  return redirect(kClientPaths.withURL(kClientPaths.app.org.index));
}
