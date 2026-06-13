// Sync the indexable docs corpus from the repo root into assistant/corpus/ so it can be
// bundled into the deploy zip / Docker image. The corpus lives OUTSIDE assistant/ (at the
// repo root) but the API needs it at DOCS_ROOT to index and answer.
//
// `assistant/corpus/` is generated + gitignored — re-run this before building/packaging.
// The relative layout under corpus/ must match the allowlist in apps/api/src/docs/sources.ts
// (paths are resolved relative to DOCS_ROOT).
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url)); // assistant/scripts
const assistantDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(assistantDir, "..");
const corpusDir = path.join(assistantDir, "corpus");

// Whole directories copied recursively.
const DIRS = ["academy/content"];
// Individual files.
const FILES = [
  // AI-Agent-Harness.md now lives in docs/ and is synced via TOP_LEVEL_MD_DIRS below.
  "templates/automation-test-harness-experimental/README.md",
  "templates/automation-test-harness-experimental/AGENTS.md",
  "templates/automation-test-harness-experimental/CLAUDE.md",
  "templates/automation-test-harness-experimental/HARNESS-BLUEPRINT.md",
];
// Directories where only top-level *.md is indexed (sources.ts reads `docs` non-recursively).
const TOP_LEVEL_MD_DIRS = ["docs"];

async function main() {
  await rm(corpusDir, { recursive: true, force: true });

  for (const rel of DIRS) {
    await cp(path.join(repoRoot, rel), path.join(corpusDir, rel), { recursive: true });
  }

  for (const rel of FILES) {
    const dest = path.join(corpusDir, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(path.join(repoRoot, rel), dest);
  }

  for (const rel of TOP_LEVEL_MD_DIRS) {
    const srcDir = path.join(repoRoot, rel);
    const destDir = path.join(corpusDir, rel);
    await mkdir(destDir, { recursive: true });
    const entries = await readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        await cp(path.join(srcDir, entry.name), path.join(destDir, entry.name));
      }
    }
  }

  console.log(`Synced corpus → ${corpusDir}`);
}

main().catch((err) => {
  console.error("sync-corpus failed:", err?.message ?? err);
  process.exit(1);
});
