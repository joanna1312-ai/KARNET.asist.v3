import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyCategory } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  company: {
    findMany: vi.fn(),
    create: vi.fn(),
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
      { id: "c1", name: "FitZone", category: CompanyCategory.gym },
    ]);

    const response = await GET(new Request(endpoint));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.favorite.findMany).not.toHaveBeenCalled();
    expect(body.companies).toEqual([
      { id: "c1", name: "FitZone", category: CompanyCategory.gym, isFavorite: false },
    ]);
  });

  it("marks isFavorite for the caller's device when a token is present", async () => {
    prismaMock.favorite.findMany.mockResolvedValue([{ companyId: "c1" }]);
    prismaMock.company.findMany.mockResolvedValue([
      { id: "c1", name: "FitZone", category: CompanyCategory.gym },
      { id: "c2", name: "PoolClub", category: CompanyCategory.pool },
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
      { id: "c1", name: "FitZone", category: CompanyCategory.gym, isFavorite: true },
      { id: "c2", name: "PoolClub", category: CompanyCategory.pool, isFavorite: false },
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
      { id: "c1", name: "FitZone", category: CompanyCategory.gym },
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
      select: { id: true, name: true, category: true },
    });
    expect(body.companies).toEqual([
      { id: "c1", name: "FitZone", category: CompanyCategory.gym, isFavorite: true },
    ]);
  });
});

describe("POST /api/companies — dodanie firmy ręcznie (Sesja 8)", () => {
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
        body: JSON.stringify({ name: "", category: CompanyCategory.gym }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("nameRequired");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("rejects a company without a valid category", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "FitZone", category: "not-a-category" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("categoryRequired");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("creates a company with a trimmed name and returns 201", async () => {
    prismaMock.company.create.mockResolvedValue({
      id: "new-company",
      name: "FitZone",
      category: CompanyCategory.gym,
    });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "  FitZone  ", category: CompanyCategory.gym }),
      })
    );
    const body = await response.json();

    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: { name: "FitZone", category: CompanyCategory.gym },
      select: { id: true, name: true, category: true },
    });
    expect(response.status).toBe(201);
    expect(body.company).toEqual({
      id: "new-company",
      name: "FitZone",
      category: CompanyCategory.gym,
    });
  });
});
