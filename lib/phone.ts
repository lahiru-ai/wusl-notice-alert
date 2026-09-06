const SRI_LANKA_COUNTRY_CODE = "94";

const NATIONAL_MOBILE_PATTERN = /^7\d{8}$/;

export type PhoneValidationResult =
  | { ok: true; e164: string }
  | { ok: false; reason: string };

export function normalizeWhatsAppNumber(
  raw: string
): PhoneValidationResult {
  const cleaned = raw.replace(/[\s\-().]/g, "").trim();

  if (!cleaned) {
    return {
      ok: false,
      reason: "Enter your WhatsApp number.",
    };
  }

  const digits = cleaned.replace(/^\+/, "");

  if (!/^\d+$/.test(digits)) {
    return {
      ok: false,
      reason:
        "Phone number can only contain digits and an optional leading +.",
    };
  }

  let national: string;

  if (
    digits.length === 11 &&
    digits.startsWith(SRI_LANKA_COUNTRY_CODE)
  ) {
    national = digits.slice(2);
  } else if (digits.length === 10 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return {
      ok: false,
      reason:
        "Enter a valid Sri Lankan mobile number.",
    };
  }

  if (!NATIONAL_MOBILE_PATTERN.test(national)) {
    return {
      ok: false,
      reason:
        "Enter a valid Sri Lankan mobile number (e.g. 077 123 4567).",
    };
  }

  return {
    ok: true,
    e164: `+${SRI_LANKA_COUNTRY_CODE}${national}`,
  };
}

export function isValidWhatsAppNumber(raw: string): boolean {
  return normalizeWhatsAppNumber(raw).ok;
}

export function maskPhoneNumber(e164: string): string {
  const cleaned = e164.replace(/[\s-]/g, "");

  if (cleaned.length <= 7) return cleaned;

  return `${cleaned.slice(0, 6)}••••${cleaned.slice(-4)}`;
}