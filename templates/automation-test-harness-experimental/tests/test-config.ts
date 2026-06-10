import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Non-secret test configuration — COMMITTED and freely readable by the agent.
 *
 * Split rule (see docs/harness/CONTEXT_RULES.md → Test Data Policy):
 *  - BASE_URL and USERNAME are NOT secrets → live here, readable, env-overridable.
 *  - PASSWORD is the only secret → comes from the environment (.env), never hardcoded.
 *
 * The agent should read THIS file to learn the live base URL for a discovery pass.
 * It must NOT read `.env` (secrets).
 */

// Load the gitignored .env into process.env once (no dependency) BEFORE reading
// values below, so the secret E2E_PASSWORD and any overrides are available.
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

export const BASE_URL = process.env.E2E_BASE_URL ?? 'https://officeplace-ui-test.aod-team.com';
export const USERNAME = process.env.E2E_USERNAME ?? 'admin@aod.vn';

// SECRET — set E2E_PASSWORD in the gitignored .env. Empty here on purpose.
export const PASSWORD = process.env.E2E_PASSWORD ?? '';
