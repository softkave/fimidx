import { ICallback } from "fmdx-core/definitions/callback";
import { PageMessage } from "../internal/page-message.tsx";
import { CallbackItem, CallbackItemSkeleton } from "./callback-item.tsx";

export interface ICallbacksProps {
  callbacks: ICallback[];
}

export function CallbackItemEmpty() {
  return (
    <div className="w-full px-4">
      <PageMessage
        title="No callbacks found"
        message="Add a callback to get started"
        variant="secondary"
      />
    </div>
  );
}

export function Callbacks(props: ICallbacksProps) {
  if (props.callbacks.length === 0) {
    return <CallbackItemEmpty />;
  }

  return (
    <div className="w-full">
      {props.callbacks.map((callback) => (
        <CallbackItem key={callback.id} item={callback} />
      ))}
    </div>
  );
}

export function CallbacksSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <CallbackItemSkeleton className="w-full" />
      <CallbackItemSkeleton className="w-full" />
      <CallbackItemSkeleton className="w-full" />
    </div>
  );
}
