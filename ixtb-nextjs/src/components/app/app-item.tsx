import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { cn } from "@/src/lib/utils";
import { IApp } from "fmdx-core/definitions/app";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { AppItemMenu } from "./app-item-menu.tsx";

export interface IAppItemProps {
  item: IApp;
}

export function AppItem(props: IAppItemProps) {
  return (
    <div className="flex justify-between items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-4 py-2">
      <Link
        href={kClientPaths.app.group.app.single(
          props.item.groupId,
          props.item.id
        )}
        className="flex-1"
      >
        <div>
          <h3 className="font-medium">{props.item.name}</h3>
          <p className="text-muted-foreground">{props.item.description}</p>
        </div>
      </Link>
      <AppItemMenu app={props.item} />
    </div>
  );
}

export function AppItemSkeleton(props: { className?: string }) {
  return (
    <div className={cn("flex justify-between gap-2 px-4", props.className)}>
      <div className="flex flex-col gap-1 flex-1">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
      </div>
      <Skeleton className="w-8 h-8" />
    </div>
  );
}
