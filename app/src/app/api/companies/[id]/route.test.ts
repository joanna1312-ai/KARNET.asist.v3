import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const GYM_CATEGORY = { id: "cat-gym", slug: "gym", name: "Siłownia", color: "mint", isSystem: true };

const prismaMock = {
  company: {
    findUnique: vi.fn(),
  },
  card: {
    findMany: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));

const { GET } = await import("./route");

const companyUrl = (id: string) => `http://localhost/api/companies/${id}`;
const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(null);
});

async function authHeaders(deviceId = "device-1") {
  const token = await signDeviceToken(deviceId);
  return { Authorization: `Device ${token}` };
}

describe("GET /api/companies/:id", () => {
  it("rejects requests without a verified device token and without a session", async () => {
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

  it("returns the company with only the caller's device cards at that company", async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: "co1",
      name: "FitZone",
      category: GYM_CATEGORY,
    });
    prismaMock.card.findMany.mockResolvedValue([
      {
        id: "card-1",
        companyId: "co1",
        type: CardType.limit,
        totalVisits: 10,
        usedVisits: 2,
        expiryDate: null,
        _count: { visits: 2 },
      },
    ]);

    const response = await GET(
      new Request(companyUrl("co1"), { headers: await authHeaders("device-1") }),
      routeParams("co1")
    );
    const body = await response.json();

    expect(prismaMock.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: "co1", deletedAt: null, deviceId: "device-1" },
        orderBy: { createdAt: "desc" },
      })
    );
    expect(response.status).toBe(200);
    expect(body.company).toEqual({ id: "co1", name: "FitZone", category: GYM_CATEGORY });
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].id).toBe("card-1");
    // Sesja V6.3 — realizedVisits w odpowiedzi, osobno od surowego usedVisits.
    expect(body.cards[0].realizedVisits).toBe(2);
    expect(body.cards[0]._count).toBeUndefined();
  });

  // Regresja: ta ścieżka wcześniej filtrowała karnety WYŁĄCZNIE po deviceId, więc karnety
  // dodane przez zalogowane konto (userId ustawiony, deviceId null — patrz POST /api/cards)
  // nigdy się tu nie pojawiały, mimo że wywołujący faktycznie miał do nich dostęp.
  it("returns the company with the logged-in account's cards, not filtered by device", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.company.findUnique.mockResolvedValue({
      id: "co1",
      name: "FitZone",
      category: GYM_CATEGORY,
    });
    prismaMock.card.findMany.mockResolvedValue([
      {
        id: "card-2",
        companyId: "co1",
        type: CardType.unlimited,
        totalVisits: null,
        usedVisits: 0,
        expiryDate: "2027-01-01",
        _count: { visits: 0 },
      },
    ]);

    const response = await GET(new Request(companyUrl("co1")), routeParams("co1"));
    const body = await response.json();

    expect(prismaMock.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: "co1", deletedAt: null, userId: "user-1" },
        orderBy: { createdAt: "desc" },
      })
    );
    expect(response.status).toBe(200);
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].id).toBe("card-2");
  });

  it("prefers the account over a device token when both are present, without mixing the two spaces", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.company.findUnique.mockResolvedValue({
      id: "co1",
      name: "FitZone",
      category: GYM_CATEGORY,
    });
    prismaMock.card.findMany.mockResolvedValue([]);

    await GET(
      new Request(companyUrl("co1"), { headers: await authHeaders("device-1") }),
      routeParams("co1")
    );

    expect(prismaMock.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: "co1", deletedAt: null, userId: "user-1" },
        orderBy: { createdAt: "desc" },
      })
    );
  });
});
