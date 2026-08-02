import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Firmy nie są danymi osobowymi użytkownika — lista jest publiczna do odczytu
// (docs/DATABASE.md, sekcja RLS). Potrzebna, żeby kreator karnetu miał z czego wybierać;
// pełne "dodawanie firmy ręcznie" (POST) to Sesja 8.
export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });

  return NextResponse.json({ companies });
}
