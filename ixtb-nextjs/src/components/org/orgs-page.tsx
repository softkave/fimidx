import { AppPage } from "../internal/app-page";
import { GroupListContainer } from "./groups-container";
import { GroupsHeader } from "./groups-header";

export function GroupsPage() {
  return (
    <AppPage>
      <div className="flex flex-col max-w-lg pt-0 mx-auto">
        <GroupsHeader className="p-4" />
        <GroupListContainer showNoGroupsMessage={false} />
      </div>
    </AppPage>
  );
}
