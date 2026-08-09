import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const getAiRecommendationsMock = vi.fn();
const getServerSessionMock = vi.fn().mockResolvedValue(null);

vi.mock("@/server/ai-recommendations", () => ({
  getAiRecommendations: getAiRecommendationsMock,
}));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));

const { POST } = await import("./route");

const endpoint = "http://localhost/api/ai/recommendations";

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

describe("POST /api/ai/recommendations (Sesja V4.2a — doradca AI)", () => {
  it("rejects requests without a verified device token and without a session", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: 52.2, lng: 21.0 }),
      })
    );

    expect(response.status).toBe(401);
    expect(getAiRecommendationsMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: await authHeaders(),
        body: "{not json",
      })
    );

    expect(response.status).toBe(400);
    expect(getAiRecommendationsMock).not.toHaveBeenCalled();
  });

  it("rejects a body missing lat/lng", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({}),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("locationRequired");
    expect(getAiRecommendationsMock).not.toHaveBeenCalled();
  });

  it("defaults locale to pl and passes through lat/lng/categoryId/categoryName", async () => {
    getAiRecommendationsMock.mockResolvedValue(null);

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: await authHeaders("device-1"),
        body: JSON.stringify({
          lat: 52.2297,
          lng: 21.0122,
          categoryId: "cat-gym",
          categoryName: "Siłownia",
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ recommendations: null });
    expect(getAiRecommendationsMock).toHaveBeenCalledWith(
      { deviceId: "device-1", userId: null },
      {
        lat: 52.2297,
        lng: 21.0122,
        categoryId: "cat-gym",
        categoryName: "Siłownia",
        locale: "pl",
      }
    );
  });

  it("accepts locale=en and returns whatever getAiRecommendations resolves to", async () => {
    const fakeResult = {
      recommendations: [{ name: "FitZone", reason: "High rating." }],
      relatedSuggestions: [],
    };
    getAiRecommendationsMock.mockResolvedValue(fakeResult);

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ lat: 52.2, lng: 21.0, locale: "en" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ recommendations: fakeResult });
    expect(getAiRecommendationsMock).toHaveBeenCalledWith(expect.anything(), {
      lat: 52.2,
      lng: 21.0,
      categoryId: undefined,
      categoryName: undefined,
      locale: "en",
    });
  });
});
