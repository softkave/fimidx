import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button.tsx";

export interface ICopyButtonProps {
  text: string | (() => string);
  className?: string;
}

export function CopyButton({ text: produceText, className }: ICopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text =
      typeof produceText === "function" ? produceText() : produceText;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Copied to clipboard");
  }, [produceText]);

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [isCopied]);

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size="icon"
      className={className}
    >
      {isCopied ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <CopyIcon className="w-4 h-4" />
      )}
    </Button>
  );
}
