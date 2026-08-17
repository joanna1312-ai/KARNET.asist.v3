export type RegisterInputErrorCode =
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordTooShort";

export interface RegisterInputCandidate {
  email: string | null | undefined;
  password: string | null | undefined;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Egzekwowane tu, na granicy API, niezależnie od walidacji w UI (konwencja z
// card-rules.ts) — celowo bez reguł złożoności hasła poza długością (Sesja V6.1:
// "najszybsze do wdrożenia", żeby nie frustrować użytkownika bez realnej korzyści).
export function getRegisterInputErrors(
  candidate: RegisterInputCandidate
): RegisterInputErrorCode[] {
  const errors: RegisterInputErrorCode[] = [];

  if (!candidate.email) {
    errors.push("emailRequired");
  } else if (!EMAIL_PATTERN.test(candidate.email)) {
    errors.push("emailInvalid");
  }

  if (!candidate.password) {
    errors.push("passwordRequired");
  } else if (candidate.password.length < MIN_PASSWORD_LENGTH) {
    errors.push("passwordTooShort");
  }

  return errors;
}
