import { IFetchedLog } from "@/src/definitions/log";

export interface ILogProps {
  log: IFetchedLog;
}

export function Log(props: ILogProps) {
  return (
    <div className="flex flex-col gap-8 p-4">
      <h1 className="text-lg font-bold">{props.log.id}</h1>
      <div className="flex flex-col gap-4">
        {props.log.parts.map((part) => (
          <div key={part.name} className="flex flex-col gap-1">
            <pre className="text-sm text-muted-foreground">
              <code>{part.name}</code>
            </pre>
            <pre className="text-sm">{part.value}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
