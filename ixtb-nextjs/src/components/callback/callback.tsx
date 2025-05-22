import { ICallback } from "fmdx-core/definitions/callback";

export interface ICallbackProps {
  callback: ICallback;
}

export function Callback(props: ICallbackProps) {
  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold break-all">{props.callback.id}</h1>
        </div>
      </div>
      <div className="flex flex-col gap-4"></div>
    </div>
  );
}
