import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
  },
  cardVoucherFile: {
    count: vi.fn(),
    create: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));

const { POST } = await import("./route");

const url = (id: string) => `http://localhost/api/cards/${id}/voucher-files/confirm`;
const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(null);
  prismaMock.cardVoucherFile.count.mockResolvedValue(0);
});

async function authHeaders(deviceId = "device-1") {
  return { Authorization: `Device ${await signDeviceToken(deviceId)}`, "Content-Type": "application/json" };
}

const existingCard = {
  id: "card-1",
  deviceId: "device-1",
  companyId: "co1",
  type: CardType.limit,
  totalVisits: 10,
  usedVisits: 2,
  expiryDate: null,
  voucherMode: VoucherMode.single,
  deletedAt: null,
};

describe("POST /api/cards/:id/voucher-files/confirm", () => {
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
    prismaMock.card.findFirst.mockResolvedValue(existingCard);

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
    expect(prismaMock.cardVoucherFile.create).not.toHaveBeenCalled();
  });

  it("rejects once the card already has 5 files (race with sign-upload)", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);
    prismaMock.cardVoucherFile.count.mockResolvedValue(5);

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ path: "cards/card-1/new.jpg" }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("limit_reached");
    expect(prismaMock.cardVoucherFile.create).not.toHaveBeenCalled();
  });

  it("creates a new CardVoucherFile row instead of overwriting a single URL", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);
    prismaMock.cardVoucherFile.create.mockResolvedValue({ id: "file-1" });

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ path: "cards/card-1/new.jpg" }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.file).toEqual({ id: "file-1" });
    expect(prismaMock.cardVoucherFile.create).toHaveBeenCalledWith({
      data: { cardId: "card-1", storagePath: "cards/card-1/new.jpg" },
    });
  });
});
