import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  cardVoucherFile: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);
const removeVoucherObjectMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/server/storage", () => ({
  removeVoucherObject: removeVoucherObjectMock,
}));

const { POST } = await import("./route");

const url = "http://localhost/api/account/reset-cards";

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(null);
  prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
});

async function authHeaders(deviceId = "device-1") {
  return { Authorization: `Device ${await signDeviceToken(deviceId)}` };
}

describe("POST /api/account/reset-cards", () => {
  it("rejects requests without a verified identity", async () => {
    const response = await POST(new Request(url, { method: "POST" }));
    expect(response.status).toBe(401);
    expect(prismaMock.card.findMany).not.toHaveBeenCalled();
  });

  it("returns count 0 and skips writes when the caller has no cards", async () => {
    prismaMock.card.findMany.mockResolvedValue([]);

    const response = await POST(
      new Request(url, { method: "POST", headers: await authHeaders() })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, count: 0 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("soft-deletes every owned card, clears voucher files and removes storage objects", async () => {
    prismaMock.card.findMany.mockResolvedValue([
      { id: "card-1", voucherFiles: [{ storagePath: "cards/card-1/a.jpg" }] },
      { id: "card-2", voucherFiles: [] },
    ]);

    const response = await POST(
      new Request(url, { method: "POST", headers: await authHeaders() })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, count: 2 });

    expect(prismaMock.card.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, deviceId: "device-1" },
      select: { id: true, voucherFiles: { select: { storagePath: true } } },
    });
    expect(prismaMock.cardVoucherFile.deleteMany).toHaveBeenCalledWith({
      where: { cardId: { in: ["card-1", "card-2"] } },
    });
    expect(prismaMock.card.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["card-1", "card-2"] } },
      data: { deletedAt: expect.any(Date) },
    });
    expect(removeVoucherObjectMock).toHaveBeenCalledWith("cards/card-1/a.jpg");
  });

  it("still returns 200 when a storage object removal fails (best-effort)", async () => {
    prismaMock.card.findMany.mockResolvedValue([
      { id: "card-1", voucherFiles: [{ storagePath: "cards/card-1/a.jpg" }] },
    ]);
    removeVoucherObjectMock.mockRejectedValueOnce(new Error("storage_error"));

    const response = await POST(
      new Request(url, { method: "POST", headers: await authHeaders() })
    );

    expect(response.status).toBe(200);
  });
});
