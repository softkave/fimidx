import { MainAppSidebar } from "@/src/components/sidebar/main-app-sidebar";
import { use } from "react";

export default function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ groupId?: string; appId?: string }>;
}) {
  const { children, params } = props;
  const { groupId, appId } = use(params);

  return (
    <>
      <MainAppSidebar groupId={groupId} appId={appId} />
      <main className="flex-1">{children}</main>
    </>
  );
}
