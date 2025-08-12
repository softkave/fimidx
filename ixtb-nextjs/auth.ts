import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getCoreConfig } from "fimidx-core/common/getCoreConfig";
import { authDb } from "fimidx-core/db/auth-schema";
import { checkIsAdminEmail } from "fimidx-core/serverHelpers/isAdmin";
import NextAuth, { Session } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import type { NextRequest } from "next/server";
import { fimidxNextAuthLogger } from "./src/lib/common/logger/fimidx-logger";
import { sendVerificationRequestEmail } from "./src/lib/serverHelpers/emails/sendVerificationRequestEmail";

const { resend } = getCoreConfig();

export const { handlers, signIn, signOut, auth } = NextAuth({
  logger: fimidxNextAuthLogger,
  providers: [
    Google,
    Resend({
      from: resend.fromEmail,
      async sendVerificationRequest({ identifier: email, url }) {
        await sendVerificationRequestEmail({
          to: email,
          url,
        });
      },
    }),
  ],
  adapter: DrizzleAdapter(authDb),
  // debug: true,
  callbacks: {
    session: async ({ session, user }) => {
      const isAdmin = checkIsAdminEmail(user.email);
      return {
        expires: session.expires,
        user: {
          isAdmin,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          id: session.user.id,
        },
      };
    },
  },
  pages: {
    error: "/error",
    verifyRequest: "/verify-request",
  },
});

export interface NextAuthRequest extends NextRequest {
  auth: Session | null;
}
