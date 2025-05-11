import { cn } from "@/src/lib/utils";
import { Separator } from "../ui/separator";

export interface IPrefixSuffixNodeProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * A very opinionated component that allows you to add a prefix and suffix to a
 * component.
 */
export function PrefixSuffixNode(props: IPrefixSuffixNodeProps) {
  const {
    prefix: prefixNode,
    suffix: suffixNode,
    className,
    children: mainNode,
  } = props;

  if (prefixNode && suffixNode) {
    return (
      <div
        className={cn("grid grid-cols-[1fr_auto_2fr_auto] gap-2", className)}
      >
        {prefixNode}
        <Separator orientation="vertical" className="h-4" />
        {mainNode}
        {suffixNode}
      </div>
    );
  } else if (prefixNode) {
    return (
      <div className={cn("grid grid-cols-[1fr_auto_2fr] gap-2", className)}>
        {prefixNode}
        <Separator orientation="vertical" className="h-4" />
        {mainNode}
      </div>
    );
  } else if (suffixNode) {
    return (
      <div className={cn("grid grid-cols-[1fr_auto] gap-2", className)}>
        {mainNode}
        {suffixNode}
      </div>
    );
  }

  return mainNode;
}
