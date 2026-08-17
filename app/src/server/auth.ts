import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

// ADR-003: konto to nadbudowa nad trybem bez konta (device_id), auth token-based, nie
// cookie sesyjne z myślą o przyszłym mobile — stąd `strategy: "jwt"` (sesja jako podpisany
// token, nie rekord w bazie), a nie domyślna strategia `database` adaptera Prisma.
// Konto zawsze opcjonalne (CLAUDE.md) — logowanie nie jest wymagane przez żadną funkcję
// rdzeniową.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    // Sesja V6.1: druga metoda logowania obok Google, bez nowej zależności zewnętrznej.
    // Błąd zawsze generyczny ("nieprawidłowy e-mail lub hasło") — nie zdradzamy, czy to
    // e-mail nie istnieje, konto jest Google-owe bez hasła, czy hasło jest błędne.
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
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
