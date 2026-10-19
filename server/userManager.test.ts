import { afterEach, describe, expect, it, vi } from "vitest";
import { getUserManagerConfig } from "./userManager";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getUserManagerConfig", () => {
  it("refuses a missing or non-HTTPS configuration", () => {
    vi.stubEnv("USERMANAGER_API_BASE_URL", "http://10.10.10.1");
    vi.stubEnv("USERMANAGER_API_TOKEN", "test-token");

    expect(getUserManagerConfig()).toBeNull();
  });

  it("accepts only complete HTTPS server-side configuration", () => {
    vi.stubEnv("USERMANAGER_API_BASE_URL", "https://usermanager.example.internal/api");
    vi.stubEnv("USERMANAGER_API_TOKEN", "test-token");

    expect(getUserManagerConfig()).toMatchObject({
      baseUrl: "https://usermanager.example.internal/api",
      timeoutMs: 8000,
    });
  });
});
