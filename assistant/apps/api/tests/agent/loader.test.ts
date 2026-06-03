import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadSkillRegistry, skillMetas } from "../../src/agent/skills/loader";

const FIXTURES = resolve(__dirname, "__fixtures__");

describe("loadSkillRegistry", () => {
  test("parses a valid SKILL.md into the registry", () => {
    const reg = loadSkillRegistry(FIXTURES);
    const skill = reg.get("fixture-skill");
    expect(skill).toBeDefined();
    expect(skill!.description).toBe("A fixture skill used by loader tests.");
    expect(skill!.whenToUse).toBe("When the loader test runs.");
    expect(skill!.body).toContain("SECRET_BODY_MARKER");
  });

  test("skips a skill with no description (does not throw)", () => {
    const reg = loadSkillRegistry(FIXTURES);
    expect(reg.has("broken-skill")).toBe(false);
  });

  test("returns an empty registry for a missing root", () => {
    const reg = loadSkillRegistry(resolve(FIXTURES, "does-not-exist"));
    expect(reg.size).toBe(0);
  });

  test("skillMetas returns name + description + whenToUse only (no body)", () => {
    const metas = skillMetas(loadSkillRegistry(FIXTURES));
    const meta = metas.find((m) => m.name === "fixture-skill");
    expect(meta).toEqual({
      name: "fixture-skill",
      description: "A fixture skill used by loader tests.",
      whenToUse: "When the loader test runs.",
    });
    expect(JSON.stringify(metas)).not.toContain("SECRET_BODY_MARKER");
  });
});
