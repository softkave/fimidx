import { AppPage } from "../internal/app-page";
import { OrgListContainer } from "./orgs-container";
import { OrgsHeader } from "./orgs-header";

export function OrgsPage() {
  return (
    <AppPage>
      <div className="flex flex-col max-w-lg pt-0 mx-auto">
        <OrgsHeader className="p-4" />
        <OrgListContainer showNoOrgsMessage={false} />
      </div>
    </AppPage>
  );
}
