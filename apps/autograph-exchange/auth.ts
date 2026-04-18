import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash } from "node:crypto";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

function slugifyUserId(email: string) {
  return email.trim().toLowerCase();
}

function resolveAuthSecret() {
  const configuredSecret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  ) {
    return createHash("sha256")
      .update("autograph-exchange-local-dev-secret")
      .digest("hex");
  }

  throw new Error(
    "Missing AUTH_SECRET. Set AUTH_SECRET or NEXTAUTH_SECRET before starting the standalone site in production.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: resolveAuthSecret(),
  providers: [
    Credentials({
      name: "Autograph Exchange",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const name = typeof credentials?.name === "string" ? credentials.name.trim() : "";
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";

        if (!name || !email) {
          return null;
        }

        return {
          id: slugifyUserId(email),
          name,
          email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (user?.name) {
        token.name = user.name;
      }
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      if (session.user && token.name) {
        session.user.name = token.name;
      }
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  trustHost: true,
});
