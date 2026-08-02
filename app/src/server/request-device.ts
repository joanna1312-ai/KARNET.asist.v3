import { extractDeviceTokenFromHeader, verifyDeviceToken } from "./device-token";

// ADR-007: jedyne dopuszczalne źródło zaufanego deviceId dla żądań API w trybie bez
// konta — token z nagłówka Authorization, zweryfikowany podpisem. Surowy device_id
// z body/query nigdy nie jest tu brany pod uwagę.
export async function getVerifiedDeviceId(request: Request): Promise<string | null> {
  const token = extractDeviceTokenFromHeader(request.headers.get("authorization"));
  if (!token) return null;
  return verifyDeviceToken(token);
}
