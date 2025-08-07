import { ILog } from "fimidx-core/definitions/log";

export interface ILogProps {
  log: ILog;
}

export function Log(props: ILogProps) {
  const timestamp = props.log.createdAt.toLocaleString();
  const level = props.log.data.level ?? "unknown";
  const message = props.log.data.message ?? "unknown";

  const json = JSON.stringify(props.log.data, null, 2);

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">{props.log.id}</h1>
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground">Timestamp</p>
          <p>{timestamp}</p>
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground">Level</p>
          <p>{level}</p>
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground">Message</p>
          <p>{message}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <pre className="text-sm">{json}</pre>
      </div>
    </div>
  );
}
