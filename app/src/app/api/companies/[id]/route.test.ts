import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, CompanyCategory, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  company: {
    findUnique: vi.fn(),
  },
  card: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { GET } = await import("./route");

const companyUrl = (id: string) => `http://localhost/api/companies/${id}`;
const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
});

async function authHeaders(deviceId = "device-1") {
  const token = await signDeviceToken(deviceId);
  return { Authorization: `Device ${token}` };
}

describe("GET /api/companies/:id", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await GET(new Request(companyUrl("co1")), routeParams("co1"));
    expect(response.status).toBe(401);
    expect(prismaMock.company.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the company does not exist", async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);

    const response = await GET(
      new Request(companyUrl("missing"), { headers: await authHeaders() }),
      routeParams("missing")
    );

    expect(response.status).toBe(404);
    expect(prismaMock.card.findMany).not.toHaveBeenCalled();
  });

  it("returns the company with only the caller's cards at that company", async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: "co1",
      name: "FitZone",
      category: CompanyCategory.gym,
    });
    prismaMock.card.findMany.mockResolvedValue([
      {
        id: "card-1",
        companyId: "co1",
        type: CardType.limit,
        totalVisits: 10,
        usedVisits: 2,
        expiryDate: null,
        voucherMode: VoucherMode.single,
      },
    ]);

    const response = await GET(
      new Request(companyUrl("co1"), { headers: await authHeaders("device-1") }),
      routeParams("co1")
    );
    const body = await response.json();

    expect(prismaMock.card.findMany).toHaveBeenCalledWith({
      where: { companyId: "co1", deviceId: "device-1", deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    expect(response.status).toBe(200);
    expect(body.company).toEqual({ id: "co1", name: "FitZone", category: CompanyCategory.gym });
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].id).toBe("card-1");
  });
});
