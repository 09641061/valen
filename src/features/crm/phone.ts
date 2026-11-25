import { E164_PHONE_REGEX } from "./schemas";

const ONE_DIGIT_COUNTRY_CODES = new Set(["1", "7"]);

const TWO_DIGIT_COUNTRY_CODES = new Set([
  "20",
  "27",
  "30",
  "31",
  "32",
  "33",
  "34",
  "36",
  "39",
  "40",
  "41",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "81",
  "82",
  "84",
  "86",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "98",
]);

export interface PhoneParts {
  countryCode: string;
  localNumber: string;
}

export interface PhoneValidationResult {
  phone?: string;
  countryCodeError?: string;
  localNumberError?: string;
}

/** Keeps an optional leading '+' followed by at most 3 ASCII digits. */
export function normalizeCountryCodeInput(value: string): string {
  const prefix = value.trimStart().startsWith("+") ? "+" : "";
  const digits = value.replace(/[^0-9]/g, "").slice(0, 3);
  return `${prefix}${digits}`;
}

/** Strips all non-ASCII-digit characters from a local phone number input. */
export function normalizeLocalNumberInput(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/** Splits an E.164 phone number into prefix-free country code and local number parts. */
export function splitE164Phone(phone: string): PhoneParts {
  const trimmed = phone.trim();
  if (!trimmed.startsWith("+")) {
    return {
      countryCode: "",
      localNumber: normalizeLocalNumberInput(trimmed),
    };
  }

  const digits = normalizeLocalNumberInput(trimmed);
  if (!digits) {
    return { countryCode: "", localNumber: "" };
  }

  if (ONE_DIGIT_COUNTRY_CODES.has(digits[0])) {
    return {
      countryCode: `+${digits[0]}`,
      localNumber: digits.slice(1),
    };
  }

  if (digits.length >= 2 && TWO_DIGIT_COUNTRY_CODES.has(digits.slice(0, 2))) {
    return {
      countryCode: `+${digits.slice(0, 2)}`,
      localNumber: digits.slice(2),
    };
  }

  const code = digits.slice(0, 3);
  return {
    countryCode: `+${code}`,
    localNumber: digits.slice(code.length),
  };
}

/** Combines normalized country code and local number digits into an E.164 string. */
export function combinePhoneParts(
  countryCode: string,
  localNumber: string,
): string {
  const codeDigits = normalizeLocalNumberInput(countryCode);
  const localDigits = normalizeLocalNumberInput(localNumber);
  const prefix = codeDigits ? `+${codeDigits}` : "";
  return `${prefix}${localDigits}`;
}

/** Validates split phone inputs and returns the combined E.164 value or field errors. */
export function validatePhoneParts(
  countryCode: string,
  localNumber: string,
): PhoneValidationResult {
  const codeDigits = normalizeLocalNumberInput(countryCode);
  const localDigits = normalizeLocalNumberInput(localNumber);

  if (!codeDigits) {
    return { countryCodeError: "Enter a country code (e.g. +57)" };
  }
  if (codeDigits.startsWith("0")) {
    return { countryCodeError: "Country code must start with 1-9" };
  }
  if (!localDigits) {
    return { localNumberError: "Enter a phone number" };
  }

  const phone = combinePhoneParts(codeDigits, localDigits);
  if (!E164_PHONE_REGEX.test(phone)) {
    return {
      localNumberError:
        "Enter a valid phone number (7 to 15 digits total with country code)",
    };
  }

  return { phone };
}
