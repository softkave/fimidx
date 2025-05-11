import { DrizzleAdapter } from "@auth/drizzle-adapter";
import assert from "assert";
import NextAuth, { Session } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import type { NextRequest } from "next/server";
import { authDb } from "./src/db/auth-schema.ts";
import { sendVerificationRequestEmail } from "./src/lib/serverHelpers/emails/sendVerificationRequestEmail.tsx";
import { checkIsAdminEmail } from "./src/lib/serverHelpers/isAdmin.ts";

const fromEmail = process.env.RESEND_FROM_EMAIL;
assert(fromEmail, "RESEND_FROM_EMAIL is not set");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Resend({
      from: fromEmail,
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
