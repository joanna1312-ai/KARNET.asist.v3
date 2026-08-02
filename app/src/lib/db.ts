import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Jedna instancja PrismaClient na proces — w dev (hot reload Next.js) trzymamy ją na
// globalThis, żeby każdy reload modułu nie otwierał nowego połączenia z bazą.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 nie ma już wbudowanego silnika zapytań — połączenie z bazą idzie przez
// jawny driver adapter (tu: @prisma/adapter-pg dla Postgresa).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
