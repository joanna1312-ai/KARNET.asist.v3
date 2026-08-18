import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const GYM_CATEGORY = { id: "cat-gym", slug: "gym", name: "Siłownia", color: "mint", isSystem: true };
const POOL_CATEGORY = { id: "cat-pool", slug: "pool", name: "Basen", color: "sky", isSystem: true };

const prismaMock = {
  company: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  category: {
    findUnique: vi.fn(),
  },
  favorite: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { GET, POST } = await import("./route");

const endpoint = "http://localhost/api/companies";

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

describe("GET /api/companies", () => {
  it("returns the list of companies without requiring auth (public read), isFavorite false", async () => {
    prismaMock.company.findMany.mockResolvedValue([
      { id: "c1", name: "FitZone", category: GYM_CATEGORY },
    ]);

    const response = await GET(new Request(endpoint));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.favorite.findMany).not.toHaveBeenCalled();
    expect(body.companies).toEqual([
      { id: "c1", name: "FitZone", category: GYM_CATEGORY, isFavorite: false },
    ]);
  });

  it("marks isFavorite for the caller's device when a token is present", async () => {
    prismaMock.favorite.findMany.mockResolvedValue([{ companyId: "c1" }]);
    prismaMock.company.findMany.mockResolvedValue([
      { id: "c1", name: "FitZone", category: GYM_CATEGORY },
      { id: "c2", name: "PoolClub", category: POOL_CATEGORY },
    ]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders("device-1") })
    );
    const body = await response.json();

    expect(prismaMock.favorite.findMany).toHaveBeenCalledWith({
      where: { deviceId: "device-1" },
      select: { companyId: true },
    });
    expect(body.companies).toEqual([
      { id: "c1", name: "FitZone", category: GYM_CATEGORY, isFavorite: true },
      { id: "c2", name: "PoolClub", category: POOL_CATEGORY, isFavorite: false },
    ]);
  });

  it("rejects ?favorites=true without a verified device token", async () => {
    const response = await GET(new Request(`${endpoint}?favorites=true`));
    expect(response.status).toBe(401);
    expect(prismaMock.company.findMany).not.toHaveBeenCalled();
  });

  it("filters to only favorited companies when ?favorites=true", async () => {
    prismaMock.favorite.findMany.mockResolvedValue([{ companyId: "c1" }]);
    prismaMock.company.findMany.mockResolvedValue([
      { id: "c1", name: "FitZone", category: GYM_CATEGORY },
    ]);

    const response = await GET(
      new Request(`${endpoint}?favorites=true`, {
        headers: await authHeaders("device-1"),
      })
    );
    const body = await response.json();

    expect(prismaMock.company.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["c1"] } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        category: {
          select: { id: true, slug: true, name: true, color: true, isSystem: true },
        },
      },
    });
    expect(body.companies).toEqual([
      { id: "c1", name: "FitZone", category: GYM_CATEGORY, isFavorite: true },
    ]);
  });
});

describe("POST /api/companies — dodanie firmy ręcznie (Sesja 8, kategorie od Sesji 16)", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await POST(new Request(endpoint, { method: "POST" }));
    expect(response.status).toBe(401);
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("rejects a company without a name", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", categoryId: GYM_CATEGORY.id }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("nameRequired");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("rejects a company without a categoryId", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "FitZone" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("categoryRequired");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("rejects a categoryId that does not exist", async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "FitZone", categoryId: "missing" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("categoryRequired");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("rejects another device's private category", async () => {
    prismaMock.category.findUnique.mockResolvedValue({
      id: "cat-other",
      isSystem: false,
      createdByDeviceId: "device-2",
    });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders("device-1")), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "FitZone", categoryId: "cat-other" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("categoryRequired");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("creates a company with a trimmed name and returns 201", async () => {
    prismaMock.category.findUnique.mockResolvedValue({
      id: GYM_CATEGORY.id,
      isSystem: true,
      createdByDeviceId: null,
    });
    prismaMock.company.create.mockResolvedValue({
      id: "new-company",
      name: "FitZone",
      category: GYM_CATEGORY,
    });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "  FitZone  ", categoryId: GYM_CATEGORY.id }),
      })
    );
    const body = await response.json();

    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: {
        name: "FitZone",
        categoryId: GYM_CATEGORY.id,
        address: null,
        lat: null,
        lng: null,
        googlePlaceId: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        category: {
          select: { id: true, slug: true, name: true, color: true, isSystem: true },
        },
      },
    });
    expect(response.status).toBe(201);
    expect(body.company).toEqual({
      id: "new-company",
      name: "FitZone",
      category: GYM_CATEGORY,
    });
  });

  it("rejects a company with only lat set (no lng)", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "FitZone", categoryId: GYM_CATEGORY.id, lat: 52.2297 }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("locationIncomplete");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("creates a company with lat/lng/googlePlaceId from Google Places (Sesja V4.1)", async () => {
    prismaMock.category.findUnique.mockResolvedValue({
      id: GYM_CATEGORY.id,
      isSystem: true,
      createdByDeviceId: null,
    });
    prismaMock.company.create.mockResolvedValue({
      id: "new-company",
      name: "FitZone",
      lat: 52.2297,
      lng: 21.0122,
      category: GYM_CATEGORY,
    });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "FitZone",
          categoryId: GYM_CATEGORY.id,
          address: "ul. Testowa 1, Warszawa",
          lat: 52.2297,
          lng: 21.0122,
          googlePlaceId: "ChIJ_test",
        }),
      })
    );

    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: {
        name: "FitZone",
        categoryId: GYM_CATEGORY.id,
        address: "ul. Testowa 1, Warszawa",
        lat: 52.2297,
        lng: 21.0122,
        googlePlaceId: "ChIJ_test",
      },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        category: {
          select: { id: true, slug: true, name: true, color: true, isSystem: true },
        },
      },
    });
    expect(response.status).toBe(201);
  });

  it("allows a device's own private category", async () => {
    prismaMock.category.findUnique.mockResolvedValue({
      id: "cat-own",
      isSystem: false,
      createdByDeviceId: "device-1",
    });
    prismaMock.company.create.mockResolvedValue({
      id: "new-company",
      name: "Squash Club",
      category: { id: "cat-own", slug: null, name: "Squash", color: "sky", isSystem: false },
    });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders("device-1")), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Squash Club", categoryId: "cat-own" }),
      })
    );

    expect(response.status).toBe(201);
  });
});
