import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

// ADR-003: konto to nadbudowa nad trybem bez konta (device_id), auth token-based, nie
// cookie sesyjne z myślą o przyszłym mobile — stąd `strategy: "jwt"` (sesja jako podpisany
// token, nie rekord w bazie), a nie domyślna strategia `database` adaptera Prisma.
// Konto zawsze opcjonalne (CLAUDE.md) — logowanie nie jest wymagane przez żadną funkcję
// rdzeniową, tylko przez POST /api/auth/link-device (synchronizacja między urządzeniami).
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
