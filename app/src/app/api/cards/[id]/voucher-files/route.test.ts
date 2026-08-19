import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
  },
  cardVoucherFile: {
    findMany: vi.fn(),
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

const url = (id: string) => `http://localhost/api/cards/${id}/voucher-files`;
const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(null);
});

async function authHeaders(deviceId = "device-1") {
  return { Authorization: `Device ${await signDeviceToken(deviceId)}` };
}

const baseCard = {
  id: "card-1",
  deviceId: "device-1",
  companyId: "co1",
  type: CardType.limit,
  totalVisits: 10,
  usedVisits: 2,
  expiryDate: null,
  deletedAt: null,
};

describe("GET /api/cards/:id/voucher-files", () => {
  it("returns 404 when the card does not belong to the caller", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await GET(
      new Request(url("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
  });

  it("returns an empty list when the card has no files", async () => {
    prismaMock.card.findFirst.mockResolvedValue(baseCard);
    prismaMock.cardVoucherFile.findMany.mockResolvedValue([]);

    const response = await GET(
      new Request(url("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.files).toEqual([]);
  });

  it("returns fresh signed URLs for all files of the card", async () => {
    prismaMock.card.findFirst.mockResolvedValue(baseCard);
    prismaMock.cardVoucherFile.findMany.mockResolvedValue([
      { id: "file-1", storagePath: "cards/card-1/a.jpg" },
      { id: "file-2", storagePath: "cards/card-1/b.pdf" },
    ]);
    createVoucherReadUrlMock.mockImplementation(async (path: string) => `https://signed/${path}`);

    const response = await GET(
      new Request(url("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.files).toEqual([
      { id: "file-1", url: "https://signed/cards/card-1/a.jpg", kind: "image" },
      { id: "file-2", url: "https://signed/cards/card-1/b.pdf", kind: "pdf" },
    ]);
  });

  it("skips a file whose signed URL fails to generate, without failing the whole request", async () => {
    prismaMock.card.findFirst.mockResolvedValue(baseCard);
    prismaMock.cardVoucherFile.findMany.mockResolvedValue([
      { id: "file-1", storagePath: "cards/card-1/a.jpg" },
    ]);
    createVoucherReadUrlMock.mockRejectedValue(new Error("sign_read_failed"));

    const response = await GET(
      new Request(url("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.files).toEqual([]);
  });
});
