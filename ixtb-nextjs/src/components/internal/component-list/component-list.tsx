import { cn } from "@/src/lib/utils";
import { Fragment } from "react";
import { Separator } from "../../ui/separator";

export function ComponentList(props: {
  count: number;
  renderItem: (index: number) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", props.className)}>
      {Array.from({ length: props.count }).map((_, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <div className="md:px-4">
              <Separator />
            </div>
          )}
          {props.renderItem(index)}
        </Fragment>
      ))}
    </div>
  );
}
