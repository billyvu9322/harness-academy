import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

// Non-secret config is committed here so agents and humans can read it without
// touching .env (see CLAUDE.md "Test Config"). Override via env vars when needed.
export const BASE_URL =
  process.env.E2E_BASE_URL ?? "https://officeplace-ui-test.aod-team.com";
export const USERNAME = process.env.E2E_USERNAME ?? "admin@aod.vn";

// The password is the only secret: it lives in the gitignored .env.
export const PASSWORD = process.env.E2E_PASSWORD ?? "";
