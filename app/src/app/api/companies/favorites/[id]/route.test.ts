import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  company: {
    findUnique: vi.fn(),
  },
  favorite: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { POST, DELETE } = await import("./route");

const favoriteUrl = (id: string) => `http://localhost/api/companies/favorites/${id}`;
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

describe("POST /api/companies/favorites/:id", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await POST(
      new Request(favoriteUrl("co1"), { method: "POST" }),
      routeParams("co1")
    );
    expect(response.status).toBe(401);
    expect(prismaMock.favorite.upsert).not.toHaveBeenCalled();
  });

  it("returns 404 when the company does not exist", async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);

    const response = await POST(
      new Request(favoriteUrl("missing"), { method: "POST", headers: await authHeaders() }),
      routeParams("missing")
    );

    expect(response.status).toBe(404);
    expect(prismaMock.favorite.upsert).not.toHaveBeenCalled();
  });

  it("upserts the favorite for the caller's device and returns 204", async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: "co1" });
    prismaMock.favorite.upsert.mockResolvedValue({});

    const response = await POST(
      new Request(favoriteUrl("co1"), {
        method: "POST",
        headers: await authHeaders("device-1"),
      }),
      routeParams("co1")
    );

    expect(prismaMock.favorite.upsert).toHaveBeenCalledWith({
      where: { deviceId_companyId: { deviceId: "device-1", companyId: "co1" } },
      create: { deviceId: "device-1", companyId: "co1" },
      update: {},
    });
    expect(response.status).toBe(204);
  });
});

describe("DELETE /api/companies/favorites/:id", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await DELETE(
      new Request(favoriteUrl("co1"), { method: "DELETE" }),
      routeParams("co1")
    );
    expect(response.status).toBe(401);
    expect(prismaMock.favorite.deleteMany).not.toHaveBeenCalled();
  });

  it("removes the favorite for the caller's device and returns 204, even if it wasn't favorited", async () => {
    prismaMock.favorite.deleteMany.mockResolvedValue({ count: 0 });

    const response = await DELETE(
      new Request(favoriteUrl("co1"), {
        method: "DELETE",
        headers: await authHeaders("device-1"),
      }),
      routeParams("co1")
    );

    expect(prismaMock.favorite.deleteMany).toHaveBeenCalledWith({
      where: { deviceId: "device-1", companyId: "co1" },
    });
    expect(response.status).toBe(204);
  });
});
