import { cn } from "@/src/lib/utils.ts";
import { AppPage } from "../internal/app-page.tsx";
import { CallbackListContainer } from "./callbacks-container.tsx";
import { CallbacksHeader } from "./callbacks-header.tsx";

export function CallbacksPage(props: { appId: string; className?: string }) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <CallbacksHeader className="p-4" />
        <CallbackListContainer
          appId={props.appId}
          showNoCallbacksMessage={false}
        />
      </div>
    </AppPage>
  );
}
