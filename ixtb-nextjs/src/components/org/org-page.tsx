import { AppPage } from "../internal/app-page";
import { GroupTab } from "./group";
import { GroupContainer } from "./group-container";

export interface IGroupPageProps {
  groupId: string;
  defaultTab: GroupTab;
}

export function GroupPage(props: IGroupPageProps) {
  return (
    <AppPage>
      <GroupContainer groupId={props.groupId} defaultTab={props.defaultTab} />
    </AppPage>
  );
}
