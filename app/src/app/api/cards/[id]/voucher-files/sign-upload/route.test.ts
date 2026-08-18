import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
  },
  cardVoucherFile: {
    count: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);
const createVoucherUploadUrlMock = vi.fn();

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/server/storage", () => ({
  createVoucherUploadUrl: createVoucherUploadUrlMock,
}));

const { POST } = await import("./route");

const url = (id: string) => `http://localhost/api/cards/${id}/voucher-files/sign-upload`;
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

describe("POST /api/cards/:id/voucher-files/sign-upload", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await POST(
      new Request(url("card-1"), { method: "POST", body: "{}" }),
      routeParams("card-1")
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when the card does not belong to the caller", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ contentType: "image/jpeg" }),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
  });

  it("rejects once the card already has 5 files", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);
    prismaMock.cardVoucherFile.count.mockResolvedValue(5);

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ contentType: "image/jpeg" }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("limit_reached");
    expect(createVoucherUploadUrlMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported content type", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ contentType: "application/zip" }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("unsupported_content_type");
    expect(createVoucherUploadUrlMock).not.toHaveBeenCalled();
  });

  it("returns a signed upload URL scoped to this card's folder when under the limit", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);
    prismaMock.cardVoucherFile.count.mockResolvedValue(4);
    createVoucherUploadUrlMock.mockResolvedValue("https://storage.example/signed-upload");

    const response = await POST(
      new Request(url("card-1"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ contentType: "image/png" }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.uploadUrl).toBe("https://storage.example/signed-upload");
    expect(body.path).toMatch(/^cards\/card-1\/.+\.png$/);
  });
});
