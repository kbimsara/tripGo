import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Edge-safe config — no Mongoose/bcrypt imports.
// Used only in middleware for JWT verification.
// Full authorize logic lives in src/lib/auth.ts (Node.js runtime only).
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // Intentionally empty — real authorize runs in auth.ts (Node runtime)
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  session: { strategy: "jwt" },
};
