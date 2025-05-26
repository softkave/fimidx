"use client";

import { SignInContainerClient } from "../account/sign-in-container-client";
import { WebFooter } from "./web-footer";
import { WebHeader } from "./web-header";

export function WebSignin() {
  return (
    <main className="flex flex-col gap-12 w-full h-screen justify-between">
      <WebHeader className="p-6 md:p-8 py-4 md:py-4" />
      <SignInContainerClient className="p-6 md:p-8" />
      <WebFooter className="p-6 pb-4 md:p-8 md:pb-4" />
    </main>
  );
}
