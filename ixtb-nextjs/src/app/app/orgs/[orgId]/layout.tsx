import { MainAppSidebar } from "@/src/components/sidebar/main-app-sidebar";
import { use } from "react";

export default function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ orgId?: string; appId?: string }>;
}) {
  const { children, params } = props;
  const { orgId, appId } = use(params);

  return (
    <>
      <MainAppSidebar orgId={orgId} appId={appId} />
      <main className="flex-1">{children}</main>
    </>
  );
}
