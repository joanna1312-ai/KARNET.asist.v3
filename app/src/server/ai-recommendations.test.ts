import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  card: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { getAiRecommendations, __resetAiRecommendationsCacheForTests } = await import(
  "./ai-recommendations"
);

const identity = { deviceId: "device-1", userId: null };
const input = { lat: 52.2297, lng: 21.0122, locale: "pl" as const };

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  __resetAiRecommendationsCacheForTests();
  process.env.GROQ_API_KEY = "test-groq-key";
  process.env.GOOGLE_PLACES_SERVER_KEY = "test-places-key";
  prismaMock.card.findMany.mockResolvedValue([]);
});

describe("getAiRecommendations (Sesja V4.2a — doradca AI)", () => {
  it("returns null without calling any external API when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAiRecommendations(identity, input);

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null and never calls Groq when there are no nearby places and no card history", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ places: [] }));
    vi.stubGlobal("fetch", fetchMock);
    prismaMock.card.findMany.mockResolvedValue([]);

    const result = await getAiRecommendations(identity, input);

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(PLACES_URL, expect.anything());
  });

  it("degrades to null (never throws) when the Places API call fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, false, 500));
    vi.stubGlobal("fetch", fetchMock);
    prismaMock.card.findMany.mockResolvedValue([
      { company: { name: "FitZone", category: { name: "Siłownia" } } },
    ]);

    const result = await getAiRecommendations(identity, input);

    expect(result).toBeNull();
  });

  it("degrades to null (never throws) when Groq returns a non-OK response", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(
          jsonResponse({ places: [{ displayName: { text: "FitZone" }, rating: 4.5 }] })
        );
      }
      return Promise.resolve(jsonResponse({}, false, 503));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAiRecommendations(identity, input);

    expect(result).toBeNull();
  });

  it("degrades to null when Groq's content is not valid JSON", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(
          jsonResponse({ places: [{ displayName: { text: "FitZone" }, rating: 4.5 }] })
        );
      }
      return Promise.resolve(jsonResponse({ choices: [{ message: { content: "not json" } }] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAiRecommendations(identity, input);

    expect(result).toBeNull();
  });

  it("returns the parsed recommendations and related suggestions from Groq, with no mapsUrl when there's no matching nearby place", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(jsonResponse({ places: [] }));
      }
      return Promise.resolve(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: [],
                  relatedSuggestions: [{ name: "FitZone (Siłownia)", reason: "Masz tu karnet." }],
                }),
              },
            },
          ],
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    prismaMock.card.findMany.mockResolvedValue([
      { company: { name: "FitZone", category: { name: "Siłownia" } } },
    ]);

    const result = await getAiRecommendations(identity, input);

    expect(result).toEqual({
      recommendations: [],
      relatedSuggestions: [{ name: "FitZone (Siłownia)", reason: "Masz tu karnet." }],
    });
  });

  it("treats a missing GOOGLE_PLACES_SERVER_KEY as zero nearby places, not an error", async () => {
    delete process.env.GOOGLE_PLACES_SERVER_KEY;
    prismaMock.card.findMany.mockResolvedValue([
      { company: { name: "FitZone", category: { name: "Siłownia" } } },
    ]);
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                recommendations: [],
                relatedSuggestions: [{ name: "FitZone (Siłownia)", reason: "Masz tu karnet." }],
              }),
            },
          },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAiRecommendations(identity, input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(GROQ_URL, expect.anything());
    expect(result).toEqual({
      recommendations: [],
      relatedSuggestions: [{ name: "FitZone (Siłownia)", reason: "Masz tu karnet." }],
    });
  });
});

describe("getAiRecommendations — link do profilu Google Maps (Sesja V4.2b)", () => {
  it("attaches mapsUrl to a recommendation that matches a nearby place with a googleMapsUri", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(
          jsonResponse({
            places: [
              {
                displayName: { text: "FitZone" },
                rating: 4.8,
                googleMapsUri: "https://maps.google.com/?cid=12345",
              },
            ],
          })
        );
      }
      return Promise.resolve(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: [{ name: "FitZone", reason: "Wysoka ocena." }],
                  relatedSuggestions: [{ name: "FitZone", reason: "Masz tu karnet." }],
                }),
              },
            },
          ],
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAiRecommendations(identity, input);

    expect(result?.recommendations).toEqual([
      {
        name: "FitZone",
        reason: "Wysoka ocena.",
        mapsUrl: "https://maps.google.com/?cid=12345",
      },
    ]);
    // relatedSuggestions never get a mapsUrl, even with a matching name — to nie jest
    // gwarantowany wynik Google Places, tylko własna historia karnetów użytkownika.
    expect(result?.relatedSuggestions).toEqual([{ name: "FitZone", reason: "Masz tu karnet." }]);
  });

  it("leaves a recommendation without mapsUrl when the matched place has none", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(jsonResponse({ places: [{ displayName: { text: "FitZone" } }] }));
      }
      return Promise.resolve(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: [{ name: "FitZone", reason: "Wysoka ocena." }],
                  relatedSuggestions: [],
                }),
              },
            },
          ],
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAiRecommendations(identity, input);

    expect(result).toEqual({
      recommendations: [{ name: "FitZone", reason: "Wysoka ocena." }],
      relatedSuggestions: [],
    });
  });

  it("makes no extra API calls beyond the search and Groq to build the maps link", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(
          jsonResponse({
            places: [
              {
                displayName: { text: "FitZone" },
                googleMapsUri: "https://maps.google.com/?cid=12345",
              },
            ],
          })
        );
      }
      return Promise.resolve(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: [{ name: "FitZone", reason: "ok" }],
                  relatedSuggestions: [],
                }),
              },
            },
          ],
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await getAiRecommendations(identity, input);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("cache wyników Google Places (Sesja V4.2b)", () => {
  it("reuses cached nearby-places search across requests with the same location/category/locale, but still calls Groq fresh each time (personalized per user)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(jsonResponse({ places: [{ displayName: { text: "FitZone" } }] }));
      }
      return Promise.resolve(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({ recommendations: [], relatedSuggestions: [] }),
              },
            },
          ],
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await getAiRecommendations(identity, input);
    await getAiRecommendations(identity, input);

    const placesCalls = fetchMock.mock.calls.filter(([url]) => url === PLACES_URL);
    const groqCalls = fetchMock.mock.calls.filter(([url]) => url === GROQ_URL);
    expect(placesCalls).toHaveLength(1);
    expect(groqCalls).toHaveLength(2);
  });

  it("uses a separate cache entry per categoryName (different query, different result)", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === PLACES_URL) {
        return Promise.resolve(jsonResponse({ places: [] }));
      }
      return Promise.resolve(jsonResponse({}, false, 500));
    });
    vi.stubGlobal("fetch", fetchMock);

    await getAiRecommendations(identity, { ...input, categoryName: "Siłownia" });
    await getAiRecommendations(identity, { ...input, categoryName: "Basen" });

    const placesCalls = fetchMock.mock.calls.filter(([url]) => url === PLACES_URL);
    expect(placesCalls).toHaveLength(2);
  });
});
