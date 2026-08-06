import { prisma } from "@/lib/db";
import { SYSTEM_CATEGORY_IDS } from "@/server/system-categories";

// Dane demo do szybkiego testowania kreatora karnetu (docs/SETUP.md, krok 5).
// Pełne "dodawanie firmy ręcznie" przez API/UI to Sesja 8 — tu tylko seed startowy.
// categoryId wskazuje kategorię systemową (Sesja 16) po stałym id z system-categories.ts.
const companies: { name: string; categoryId: string }[] = [
  { name: "FitZone Siłownia", categoryId: SYSTEM_CATEGORY_IDS.gym },
  { name: "Aquapark Fala", categoryId: SYSTEM_CATEGORY_IDS.pool },
  { name: "Studio Ruchu Vinyasa", categoryId: SYSTEM_CATEGORY_IDS.group_classes },
  { name: "Masaż i Regeneracja Tonus", categoryId: SYSTEM_CATEGORY_IDS.massage },
  { name: "Beauty Room Nova", categoryId: SYSTEM_CATEGORY_IDS.beauty },
];

async function main() {
  for (const company of companies) {
    const existing = await prisma.company.findFirst({
      where: { name: company.name },
    });
    if (!existing) {
      await prisma.company.create({ data: company });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
