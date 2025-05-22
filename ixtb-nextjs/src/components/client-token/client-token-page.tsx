import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { ClientTokenContainer } from "./client-token-container";

export interface IClientTokenPageProps {
  clientTokenId: string;
  className?: string;
}

export function ClientTokenPage(props: IClientTokenPageProps) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <ClientTokenContainer clientTokenId={props.clientTokenId} />
      </div>
    </AppPage>
  );
}
