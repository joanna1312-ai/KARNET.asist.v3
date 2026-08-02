import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyCategory } from "@/generated/prisma/enums";

const prismaMock = {
  company: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { GET } = await import("./route");

describe("GET /api/companies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the list of companies without requiring auth (public read)", async () => {
    prismaMock.company.findMany.mockResolvedValue([
      { id: "c1", name: "FitZone", category: CompanyCategory.gym },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.companies).toEqual([
      { id: "c1", name: "FitZone", category: CompanyCategory.gym },
    ]);
  });
});
