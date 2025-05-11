import { cn } from "@/src/lib/utils.ts";
import { cva } from "class-variance-authority";

export interface IPageMessageProps {
  title: string;
  message: string;
  className?: string;
  variant?: "default" | "secondary";
}

const messageVariants = cva("py-4 px-4 w-full", {
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

export function PageMessage(props: IPageMessageProps) {
  return (
    <div
      className={cn(
        messageVariants({ variant: props.variant }),
        props.className
      )}
    >
      <h3 className="font-medium text-lg text-center">{props.title}</h3>
      <p className="text-muted-foreground text-center">{props.message}</p>
    </div>
  );
}
