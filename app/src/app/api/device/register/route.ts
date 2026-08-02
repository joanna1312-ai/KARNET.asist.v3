import { NextResponse } from "next/server";
import {
  extractDeviceTokenFromHeader,
  signDeviceToken,
  verifyDeviceToken,
} from "@/server/device-token";

// ADR-007: deviceId pochodzi wyłącznie z tego, co serwer sam wygenerował, albo
// z tego, co wyciągnięto z wcześniej zweryfikowanego, podpisanego tokena —
// nigdy z surowego device_id przekazanego przez klienta (body/query).
export async function POST(request: Request) {
  const existingToken = extractDeviceTokenFromHeader(
    request.headers.get("authorization")
  );
  const verifiedDeviceId = existingToken
    ? await verifyDeviceToken(existingToken)
    : null;

  const deviceId = verifiedDeviceId ?? crypto.randomUUID();
  const token = await signDeviceToken(deviceId);

  return NextResponse.json({ deviceId, token });
}
