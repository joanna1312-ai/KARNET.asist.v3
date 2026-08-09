import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);
const createVoucherReadUrlMock = vi.fn();

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/server/storage", () => ({
  createVoucherReadUrl: createVoucherReadUrlMock,
}));

const { GET } = await import("./route");

const url = (id: string) => `http://localhost/api/cards/${id}/voucher-file`;
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

const baseCard = {
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

describe("GET /api/cards/:id/voucher-file", () => {
  it("returns 404 when the card does not belong to the caller", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await GET(
      new Request(url("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the card's voucher is plain text, not a storage file", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...baseCard,
      voucherFileUrl: "10% zniżki - kod ABC123",
    });

    const response = await GET(
      new Request(url("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("not_a_file");
    expect(createVoucherReadUrlMock).not.toHaveBeenCalled();
  });

  it("returns a fresh signed URL for a storage-backed voucher", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...baseCard,
      voucherFileUrl: "storage:cards/card-1/voucher.jpg",
    });
    createVoucherReadUrlMock.mockResolvedValue("https://storage.example/signed-read");

    const response = await GET(
      new Request(url("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://storage.example/signed-read");
    expect(createVoucherReadUrlMock).toHaveBeenCalledWith("cards/card-1/voucher.jpg");
  });
});
