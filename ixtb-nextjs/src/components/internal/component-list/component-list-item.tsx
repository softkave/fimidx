import { cn } from "@/src/lib/utils";

export function ComponentListItem(props: {
  children: React.ReactNode;
  className?: string;
  button?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center gap-2 py-4 px-4",
        props.className
      )}
    >
      <div className="flex-1">{props.children}</div>
      {props.button}
    </div>
  );
}
