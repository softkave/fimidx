import { AppHeader } from "./app-header";

export interface IAppPageProps {
  children: React.ReactNode;
}

export function AppPage(props: IAppPageProps) {
  return (
    <div className="flex flex-col">
      <AppHeader showSidebarTrigger={true} />
      <div>{props.children}</div>
    </div>
  );
}
