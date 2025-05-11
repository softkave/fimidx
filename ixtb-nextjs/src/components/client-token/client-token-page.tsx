import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { ClientTokenContainer } from "./client-token-container";

export interface IClientTokenPageProps {
  orgId: string;
  appId: string;
  clientTokenId: string;
  className?: string;
}

export function ClientTokenPage(props: IClientTokenPageProps) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <ClientTokenContainer
          orgId={props.orgId}
          appId={props.appId}
          clientTokenId={props.clientTokenId}
        />
      </div>
    </AppPage>
  );
}
