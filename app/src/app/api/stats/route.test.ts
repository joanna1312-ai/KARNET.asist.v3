import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  visit: {
    findMany: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));

const { GET } = await import("./route");

const endpoint = "http://localhost/api/stats";

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

function visitFor(companyId: string, companyName: string, category: {
  id: string;
  slug: string | null;
  name: string;
  color: string;
  isSystem: boolean;
}) {
  return { card: { company: { id: companyId, name: companyName, category } } };
}

const GYM = { id: "cat-gym", slug: "gym", name: "Siłownia", color: "mint", isSystem: true };
const POOL = { id: "cat-pool", slug: "pool", name: "Basen", color: "sky", isSystem: true };

describe("GET /api/stats (Sesja V6.7)", () => {
  it("rejects requests without a verified device token and without a session", async () => {
    const response = await GET(new Request(endpoint));
    expect(response.status).toBe(401);
  });

  it("scopes the query to the logged-in account (userId), ignoring any device token sent alongside — no mixing between the two spaces", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.visit.findMany.mockResolvedValue([]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders("device-1") })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.visit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          card: expect.objectContaining({ deletedAt: null, userId: "user-1" }),
        }),
      })
    );
  });

  it("scopes the query to the device when there is no session", async () => {
    prismaMock.visit.findMany.mockResolvedValue([]);

    await GET(new Request(endpoint, { headers: await authHeaders("device-1") }));

    expect(prismaMock.visit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          card: expect.objectContaining({ deletedAt: null, deviceId: "device-1" }),
        }),
      })
    );
  });

  it("defaults to period=week when the query param is omitted", async () => {
    prismaMock.visit.findMany.mockResolvedValue([]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders() })
    );
    const body = await response.json();

    expect(body.period).toBe("week");
  });

  it("rejects an invalid period value", async () => {
    const response = await GET(
      new Request(`${endpoint}?period=year`, { headers: await authHeaders() })
    );

    expect(response.status).toBe(400);
    expect(prismaMock.visit.findMany).not.toHaveBeenCalled();
  });

  it("aggregates total visits, breakdown by category, and the most-visited place", async () => {
    prismaMock.visit.findMany.mockResolvedValue([
      visitFor("co1", "FitZone", GYM),
      visitFor("co1", "FitZone", GYM),
      visitFor("co2", "AquaPark", POOL),
    ]);

    const response = await GET(
      new Request(`${endpoint}?period=month`, { headers: await authHeaders() })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalVisits).toBe(3);
    expect(body.byCategory).toEqual([
      { ...GYM, count: 2 },
      { ...POOL, count: 1 },
    ]);
    expect(body.topCompany).toEqual({ id: "co1", name: "FitZone", count: 2 });
  });

  it("returns a null topCompany and empty breakdown when there are no visits in the period", async () => {
    prismaMock.visit.findMany.mockResolvedValue([]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders() })
    );
    const body = await response.json();

    expect(body.totalVisits).toBe(0);
    expect(body.byCategory).toEqual([]);
    expect(body.topCompany).toBeNull();
  });
});
