import { CompanyCategory } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

// Dane demo do szybkiego testowania kreatora karnetu (docs/SETUP.md, krok 5).
// Pełne "dodawanie firmy ręcznie" przez API/UI to Sesja 8 — tu tylko seed startowy.
const companies: { name: string; category: CompanyCategory }[] = [
  { name: "FitZone Siłownia", category: CompanyCategory.gym },
  { name: "Aquapark Fala", category: CompanyCategory.pool },
  { name: "Studio Ruchu Vinyasa", category: CompanyCategory.group_classes },
  { name: "Masaż i Regeneracja Tonus", category: CompanyCategory.massage },
  { name: "Beauty Room Nova", category: CompanyCategory.beauty },
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
