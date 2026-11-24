import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("getServerEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the default Cynthia URL when CYNTHIA_API_URL is unset", async () => {
    vi.stubEnv("CYNTHIA_API_URL", "");

    const { getServerEnv } = await import("./env");
    const env = getServerEnv();

    expect(env.CYNTHIA_API_URL).toBe("http://127.0.0.1:8081");
    expect("NEXT_PUBLIC_CYNTHIA_API_URL" in env).toBe(false);
  });

  it("accepts a valid CYNTHIA_API_URL", async () => {
    vi.stubEnv("CYNTHIA_API_URL", "https://api.cynthia.example/v1");

    const { getServerEnv } = await import("./env");
    const env = getServerEnv();

    expect(env.CYNTHIA_API_URL).toBe("https://api.cynthia.example/v1");
    expect(Object.keys(env)).toEqual(["CYNTHIA_API_URL"]);
  });

  it("rejects invalid CYNTHIA_API_URL values", async () => {
    vi.stubEnv("CYNTHIA_API_URL", "not-a-valid-url");

    const { getServerEnv } = await import("./env");

    expect(() => getServerEnv()).toThrow(
      /Invalid server environment configuration: CYNTHIA_API_URL/,
    );
  });

  it("never exposes any NEXT_PUBLIC_* keys on the returned object", async () => {
    vi.stubEnv("CYNTHIA_API_URL", "http://127.0.0.1:8081");
    vi.stubEnv("NEXT_PUBLIC_CYNTHIA_API_URL", "http://leaked.example");

    const { getServerEnv } = await import("./env");
    const env = getServerEnv();

    const nextPublicKeys = Object.keys(env).filter((key) =>
      key.startsWith("NEXT_PUBLIC_"),
    );
    expect(nextPublicKeys).toEqual([]);
  });
});
