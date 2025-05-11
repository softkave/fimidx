import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { CopyButton } from "./copy-button";

export interface IObfuscateTextProps {
  text: string;
  canCopy?: boolean;
  defaultText?: string;
  render?: (text: string) => React.ReactNode;
}

export function ObfuscateText(props: IObfuscateTextProps) {
  const { text, canCopy, defaultText, render } = props;
  const [showText, setShowText] = useState(false);

  const dots = useMemo(() => {
    return "·".repeat(text.length);
  }, [text]);

  if (text.length === 0) {
    return <div className="text-muted-foreground">{defaultText}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap break-all wrap-anywhere w-full">
        {showText ? (
          render ? (
            render(text)
          ) : (
            text
          )
        ) : (
          <div className="w-full break-words text-wrap leading-[24px] text-4xl text-muted-foreground">
            {dots}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowText(!showText)}
        >
          {showText ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </Button>
        {canCopy && <CopyButton text={text} />}
      </div>
    </div>
  );
}
