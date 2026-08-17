import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRegisterInputErrors } from "@/server/auth-rules";

const PASSWORD_HASH_ROUNDS = 10;

// POST /api/auth/register — Sesja V6.1: druga metoda logowania (e-mail+hasło) obok
// Google OAuth. Nie loguje samo — klient wywołuje signIn("credentials") po sukcesie
// (docs/API.md). Odrzuca e-mail już zajęty przez dowolne konto, w tym Google-owe bez
// hasła — świadomie bez auto-linkowania kont istniejącym e-mailem (ryzyko przejęcia
// konta, gdyby ktoś znał czyjś e-mail powiązany z Google).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };
  const candidate = {
    email: typeof email === "string" ? email.trim() : null,
    password: typeof password === "string" ? password : null,
  };

  const errors = getRegisterInputErrors(candidate);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const normalizedEmail = candidate.email!.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ errors: ["emailTaken"] }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(candidate.password!, PASSWORD_HASH_ROUNDS);

  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash },
    select: { id: true, email: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
