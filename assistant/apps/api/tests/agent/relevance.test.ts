import { describe, expect, test } from "vitest";
import { parseClassifierLabel, refusalFor } from "../../src/agent/relevance";

describe("parseClassifierLabel", () => {
  test("exact single-token outputs", () => {
    expect(parseClassifierLabel("SAFE")).toBe("SAFE");
    expect(parseClassifierLabel("OFF_TOPIC")).toBe("OFF_TOPIC");
    expect(parseClassifierLabel("INJECTION")).toBe("INJECTION");
  });

  test("chatty output still resolves the label", () => {
    expect(parseClassifierLabel("SAFE\n\nTôi là trợ lý...")).toBe("SAFE");
    expect(parseClassifierLabel("Label: OFF_TOPIC")).toBe("OFF_TOPIC");
  });

  test("case-insensitive", () => {
    expect(parseClassifierLabel("off_topic")).toBe("OFF_TOPIC");
  });

  test("injection wins when multiple tokens appear", () => {
    expect(parseClassifierLabel("SAFE? no, INJECTION")).toBe("INJECTION");
  });

  test("fail-open: no recognizable label defaults to SAFE", () => {
    expect(parseClassifierLabel("`verification gate` is a check...")).toBe(
      "SAFE",
    );
    expect(parseClassifierLabel("")).toBe("SAFE");
  });
});

describe("refusalFor", () => {
  test("returns a scope message for OFF_TOPIC and a safety message for INJECTION", () => {
    expect(refusalFor("OFF_TOPIC")).toMatch(/harness/i);
    expect(refusalFor("INJECTION")).toMatch(/an toàn|từ chối/i);
  });
});
