import { AppPage } from "../internal/app-page";
import { OrgTab } from "./org";
import { OrgContainer } from "./org-container";

export interface IOrgPageProps {
  orgId: string;
  defaultTab: OrgTab;
}

export function OrgPage(props: IOrgPageProps) {
  return (
    <AppPage>
      <OrgContainer orgId={props.orgId} defaultTab={props.defaultTab} />
    </AppPage>
  );
}
