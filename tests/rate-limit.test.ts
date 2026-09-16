import { describe, expect, it } from "vitest";
import { checkInMemoryRateLimit } from "../lib/rate-limit";

describe("in-memory request limiter", () => {
  it("blocks requests after the configured allowance", () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(checkInMemoryRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, remaining: 1 });
    expect(checkInMemoryRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, remaining: 0 });
    expect(checkInMemoryRateLimit(key, 2, 60_000)).toMatchObject({ allowed: false, remaining: 0 });
  });
});
