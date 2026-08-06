import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  category: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { GET, POST } = await import("./route");

const endpoint = "http://localhost/api/categories";

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

describe("GET /api/categories", () => {
  it("returns only system categories without a verified device token", async () => {
    prismaMock.category.findMany.mockResolvedValue([
      { id: "cat-gym", slug: "gym", name: "Siłownia", color: "mint", isSystem: true },
    ]);

    const response = await GET(new Request(endpoint));
    const body = await response.json();

    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      where: { isSystem: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, color: true, isSystem: true },
    });
    expect(response.status).toBe(200);
    expect(body.categories).toHaveLength(1);
  });

  it("also returns the caller device's own categories when a token is present", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await GET(new Request(endpoint, { headers: await authHeaders("device-1") }));

    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      where: { OR: [{ isSystem: true }, { createdByDeviceId: "device-1" }] },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, color: true, isSystem: true },
    });
  });
});

describe("POST /api/categories — dodanie własnej kategorii (Sesja 16)", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await POST(new Request(endpoint, { method: "POST" }));
    expect(response.status).toBe(401);
    expect(prismaMock.category.create).not.toHaveBeenCalled();
  });

  it("rejects a category without a name", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", color: "mint" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("nameRequired");
    expect(prismaMock.category.create).not.toHaveBeenCalled();
  });

  it("rejects a color outside the predefined palette", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Squash", color: "#ff00ff" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("colorRequired");
    expect(prismaMock.category.create).not.toHaveBeenCalled();
  });

  it("creates a private category for the caller's device and returns 201", async () => {
    prismaMock.category.create.mockResolvedValue({
      id: "new-category",
      slug: null,
      name: "Squash",
      color: "sky",
      isSystem: false,
    });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { ...(await authHeaders("device-1")), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "  Squash  ", color: "sky" }),
      })
    );
    const body = await response.json();

    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: { name: "Squash", color: "sky", isSystem: false, createdByDeviceId: "device-1" },
      select: { id: true, slug: true, name: true, color: true, isSystem: true },
    });
    expect(response.status).toBe(201);
    expect(body.category).toEqual({
      id: "new-category",
      slug: null,
      name: "Squash",
      color: "sky",
      isSystem: false,
    });
  });
});
