import { AppPage } from "../../internal/app-page";
import { MemberRequestListContainer } from "./member-request-list-container";
import { MemberRequestListHeader } from "./member-request-list-header";

export function MemberRequestListPage() {
  return (
    <AppPage>
      <div className="flex flex-col max-w-lg pt-0 mx-auto">
        <MemberRequestListHeader className="p-4" />
        <MemberRequestListContainer />
      </div>
    </AppPage>
  );
}
