import { describe, expect, it } from "vitest";
import { generateSecurePinCode } from "./security";

describe("generateSecurePinCode", () => {
  it("generates an eight-digit numeric PIN", () => {
    for (let attempt = 0; attempt < 25; attempt += 1) {
      expect(generateSecurePinCode()).toMatch(/^[1-9]\d{7}$/);
    }
  });
});
