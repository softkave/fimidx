import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { CallbackContainer } from "./callback-container";

export interface ICallbackPageProps {
  callbackId: string;
  className?: string;
}

export function CallbackPage(props: ICallbackPageProps) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <CallbackContainer callbackId={props.callbackId} />
      </div>
    </AppPage>
  );
}
