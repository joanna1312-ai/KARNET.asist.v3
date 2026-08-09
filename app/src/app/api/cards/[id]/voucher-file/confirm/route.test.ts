import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);
const removeVoucherObjectMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/server/storage", () => ({
  removeVoucherObject: removeVoucherObjectMock,
}));

const { POST } = await import("./route");

const url = (id: string) => `http://localhost/api/cards/${id}/voucher-file/confirm`;
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
  return { Authorization: `Device ${token}`, "Content-Type": "application/json" };
}

const cardWithoutFile = {
  id: "card-1",
  deviceId: "device-1",
  companyId: "co1",
  type: CardType.limit,
  totalVisits: 10,
  usedVisits: 2,
  expiryDate: null,
  voucherMode: VoucherMode.single,
  voucherFileUrl: null,
  deletedAt: null,
};

describe("POST /api/cards/:id/voucher-file/confirm", () => {
  it("returns 404 when the card does not belong to the caller", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ path: "cards/card-1/x.jpg" }),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
  });

  it("rejects a path that doesn't belong to this card", async () => {
    prismaMock.card.findFirst.mockResolvedValue(cardWithoutFile);

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ path: "cards/other-card/x.jpg" }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_path");
    expect(prismaMock.card.update).not.toHaveBeenCalled();
  });

  it("saves the storage-prefixed voucherFileUrl on first upload (no previous file to clean up)", async () => {
    prismaMock.card.findFirst.mockResolvedValue(cardWithoutFile);
    prismaMock.card.update.mockResolvedValue({
      id: "card-1",
      voucherFileUrl: "storage:cards/card-1/new.jpg",
    });

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ path: "cards/card-1/new.jpg" }),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(200);
    expect(prismaMock.card.update).toHaveBeenCalledWith({
      where: { id: "card-1" },
      data: { voucherFileUrl: "storage:cards/card-1/new.jpg" },
    });
    expect(removeVoucherObjectMock).not.toHaveBeenCalled();
  });

  it("cleans up the previous file when replacing one owned by this card", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...cardWithoutFile,
      voucherFileUrl: "storage:cards/card-1/old.jpg",
    });
    prismaMock.card.update.mockResolvedValue({
      id: "card-1",
      voucherFileUrl: "storage:cards/card-1/new.jpg",
    });

    await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ path: "cards/card-1/new.jpg" }),
      }),
      routeParams("card-1")
    );

    expect(removeVoucherObjectMock).toHaveBeenCalledWith("cards/card-1/old.jpg");
  });

  it("does NOT clean up a previous file inherited from a different card (renew)", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...cardWithoutFile,
      voucherFileUrl: "storage:cards/source-card/old.jpg",
    });
    prismaMock.card.update.mockResolvedValue({
      id: "card-1",
      voucherFileUrl: "storage:cards/card-1/new.jpg",
    });

    await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ path: "cards/card-1/new.jpg" }),
      }),
      routeParams("card-1")
    );

    expect(removeVoucherObjectMock).not.toHaveBeenCalled();
  });
});
