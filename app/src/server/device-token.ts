import { SignJWT, jwtVerify } from "jose";

// ADR-007: tryb bez konta nie ufa surowemu device_id z klienta — identyfikacja
// urządzenia odbywa się wyłącznie przez ten podpisany token (HS256).
const DEVICE_TOKEN_TTL_SECONDS = 180 * 24 * 60 * 60;
const ISSUER = "karnet-asist";
const AUDIENCE = "device";

function getSecretKey(): Uint8Array {
  const secret = process.env.DEVICE_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "DEVICE_TOKEN_SECRET nie jest ustawiony. Wygeneruj sekret (np. `openssl rand -base64 32`) " +
        "i ustaw go w .env — patrz docs/SETUP.md (ADR-007)."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signDeviceToken(deviceId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setSubject(deviceId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + DEVICE_TOKEN_TTL_SECONDS)
    .sign(getSecretKey());
}

export async function verifyDeviceToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function extractDeviceTokenFromHeader(
  authorizationHeader: string | null
): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Device" || !token) return null;
  return token;
}
