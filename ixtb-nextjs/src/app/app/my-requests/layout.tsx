import { MainAppSidebar } from "@/src/components/sidebar/main-app-sidebar";

export default function Layout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <>
      <MainAppSidebar />
      <main className="flex-1">{children}</main>
    </>
  );
}
