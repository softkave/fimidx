import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { MemberListContainer } from "./members-container";
import { MembersHeader } from "./members-header";

export function MembersPage(props: { orgId: string; className?: string }) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <MembersHeader className="p-4" orgId={props.orgId} />
        <MemberListContainer orgId={props.orgId} showNoMembersMessage={false} />
      </div>
    </AppPage>
  );
}
