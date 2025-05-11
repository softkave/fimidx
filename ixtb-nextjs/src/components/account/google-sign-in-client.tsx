"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths.ts";
import { cn } from "@/src/lib/utils.ts";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button.tsx";

export interface IGoogleSignInClientProps {
  redirectTo?: string;
  className?: string;
}

export default function GoogleSignInClient(props: IGoogleSignInClientProps) {
  const searchParams = useSearchParams();
  const redirectTo =
    props.redirectTo ??
    searchParams.get("redirectTo") ??
    kClientPaths.app.index;

  return (
    <Button
      onClick={() =>
        signIn("google", { redirectTo: kClientPaths.withURL(redirectTo) })
      }
      variant="outline"
      className={cn("w-full", props.className)}
    >
      Sign-in with Google
    </Button>
  );
}
