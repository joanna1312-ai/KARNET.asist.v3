import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { POST } = await import("./route");

const endpoint = "http://localhost/api/auth/register";

function postRequest(body: unknown) {
  return new Request(endpoint, { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register (Sesja V6.1)", () => {
  it("creates a user with a hashed password on valid input", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user-1", email: "test@example.com" });

    const response = await POST(postRequest({ email: "Test@Example.com", password: "correct-horse" }));

    expect(response.status).toBe(201);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    const createArgs = prismaMock.user.create.mock.calls[0][0];
    expect(createArgs.data.email).toBe("test@example.com");
    expect(createArgs.data.passwordHash).not.toBe("correct-horse");
    expect(createArgs.data.passwordHash.length).toBeGreaterThan(0);
  });

  it("rejects an email already used by an existing account, including Google-only accounts", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: null });

    const response = await POST(postRequest({ email: "taken@example.com", password: "correct-horse" }));

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.errors).toContain("emailTaken");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const response = await POST(postRequest({ email: "test@example.com", password: "short" }));

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.errors).toContain("passwordTooShort");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid email format", async () => {
    const response = await POST(postRequest({ email: "not-an-email", password: "correct-horse" }));

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.errors).toContain("emailInvalid");
  });

  it("rejects malformed JSON bodies", async () => {
    const response = await POST(new Request(endpoint, { method: "POST", body: "not json" }));

    expect(response.status).toBe(400);
  });
});
