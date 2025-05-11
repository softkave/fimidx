import { cn } from "@/src/lib/utils.ts";
import { AppPage } from "../internal/app-page.tsx";
import { ClientTokenListContainer } from "./client-tokens-container.tsx";
import { ClientTokensHeader } from "./client-tokens-header.tsx";

export function ClientTokensPage(props: {
  orgId: string;
  appId: string;
  className?: string;
}) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <ClientTokensHeader
          className="p-4"
          orgId={props.orgId}
          appId={props.appId}
        />
        <ClientTokenListContainer
          orgId={props.orgId}
          appId={props.appId}
          showNoClientTokensMessage={false}
        />
      </div>
    </AppPage>
  );
}
