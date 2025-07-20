import { cn } from "@/src/lib/utils";
import { PageMessage } from "../page-message";

export function ComponentListMessage(props: {
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <div className={cn("p-4", props.className)}>
      <PageMessage
        title={props.title}
        message={props.message}
        variant="secondary"
      />
    </div>
  );
}
