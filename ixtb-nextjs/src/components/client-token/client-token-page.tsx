import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { ClientTokenContainer } from "./client-token-container";

export interface IClientTokenPageProps {
  clientTokenId: string;
  appId: string;
  className?: string;
}

export function ClientTokenPage(props: IClientTokenPageProps) {
  return (
    <AppPage>
      <div className={cn("flex flex-col max-w-lg mx-auto", props.className)}>
        <ClientTokenContainer
          appId={props.appId}
          clientTokenId={props.clientTokenId}
        />
      </div>
    </AppPage>
  );
}
