import { describe, expect, it } from "vitest";
import {
  combinePhoneParts,
  normalizeCountryCodeInput,
  normalizeLocalNumberInput,
  splitE164Phone,
  validatePhoneParts,
} from "./phone";

describe("crm phone helpers", () => {
  describe("splitE164Phone", () => {
    it("splits 1-, 2-, and 3-digit E.164 country codes accurately", () => {
      expect(splitE164Phone("+573001234567")).toEqual({
        countryCode: "+57",
        localNumber: "3001234567",
      });
      expect(splitE164Phone("+14155550101")).toEqual({
        countryCode: "+1",
        localNumber: "4155550101",
      });
      expect(splitE164Phone("+79161234567")).toEqual({
        countryCode: "+7",
        localNumber: "9161234567",
      });
      expect(splitE164Phone("+525512345678")).toEqual({
        countryCode: "+52",
        localNumber: "5512345678",
      });
      expect(splitE164Phone("+593991234567")).toEqual({
        countryCode: "+593",
        localNumber: "991234567",
      });
    });

    it("falls back to 3-digit split for unlisted codes and round-trips losslessly", () => {
      const input = "+9991234567";
      const parts = splitE164Phone(input);

      expect(parts).toEqual({
        countryCode: "+999",
        localNumber: "1234567",
      });
      expect(combinePhoneParts(parts.countryCode, parts.localNumber)).toBe(input);
    });

    it("handles empty and malformed inputs without a leading plus sign", () => {
      expect(splitE164Phone("")).toEqual({
        countryCode: "",
        localNumber: "",
      });
      expect(splitE164Phone("3001234567")).toEqual({
        countryCode: "",
        localNumber: "3001234567",
      });
    });
  });

  describe("normalizeCountryCodeInput", () => {
    it("keeps optional leading plus and strips non-digits up to 3 digits", () => {
      expect(normalizeCountryCodeInput("+57abc9")).toBe("+579");
      expect(normalizeCountryCodeInput("57")).toBe("57");
      expect(normalizeCountryCodeInput("+")).toBe("+");
      expect(normalizeCountryCodeInput("")).toBe("");
      expect(normalizeCountryCodeInput("+12345")).toBe("+123");
    });
  });

  describe("normalizeLocalNumberInput", () => {
    it("strips all non-digit characters", () => {
      expect(normalizeLocalNumberInput("300-123 4567abc")).toBe("3001234567");
    });
  });

  describe("combinePhoneParts", () => {
    it("normalizes and joins country code and local number into E.164 format", () => {
      expect(combinePhoneParts("57", "3001234567")).toBe("+573001234567");
      expect(combinePhoneParts("+57", "300-123")).toBe("+57300123");
    });
  });

  describe("validatePhoneParts", () => {
    it("rejects empty country code values", () => {
      expect(validatePhoneParts("", "3001234567")).toEqual({
        countryCodeError: "Enter a country code (e.g. +57)",
      });
      expect(validatePhoneParts("+", "3001234567")).toEqual({
        countryCodeError: "Enter a country code (e.g. +57)",
      });
    });

    it("rejects country codes starting with 0", () => {
      expect(validatePhoneParts("+057", "3001234567")).toEqual({
        countryCodeError: "Country code must start with 1-9",
      });
    });

    it("rejects empty local numbers", () => {
      expect(validatePhoneParts("+57", "")).toEqual({
        localNumberError: "Enter a phone number",
      });
    });

    it("returns both country code and phone number errors when both are empty", () => {
      expect(validatePhoneParts("", "")).toEqual({
        countryCodeError: "Enter a country code (e.g. +57)",
        localNumberError: "Enter a phone number",
      });
    });

    it("rejects combined numbers shorter than 7 or longer than 15 total digits", () => {
      expect(validatePhoneParts("+57", "123")).toEqual({
        localNumberError:
          "Enter a valid phone number (7 to 15 digits total with country code)",
      });
      expect(validatePhoneParts("+593", "1234567890123")).toEqual({
        localNumberError:
          "Enter a valid phone number (7 to 15 digits total with country code)",
      });
    });

    it("returns normalized E.164 phone for valid inputs", () => {
      expect(validatePhoneParts("57", "3001234567")).toEqual({
        phone: "+573001234567",
      });
    });
  });
});
