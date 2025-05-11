import { cn } from "@/src/lib/utils";
import { cva } from "class-variance-authority";

const loadingVariants = cva("py-4 px-4 w-full", {
  variants: {
    variant: {
      default: "",
      secondary:
        "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 rounded-md",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export function PageLoading(
  props: { className?: string; variant?: "default" | "secondary" } = {}
) {
  return (
    <div
      className={cn(
        loadingVariants({ variant: props.variant }),
        props.className
      )}
    >
      <h3 className="font-medium text-lg text-center">Loading...</h3>
    </div>
  );
}
