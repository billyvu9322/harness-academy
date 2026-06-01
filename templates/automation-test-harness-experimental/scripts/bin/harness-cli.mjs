#!/usr/bin/env node
import { mkdirSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const storePath = join(root, '.harness', 'records.jsonl');

function ensureStore() {
  mkdirSync(dirname(storePath), { recursive: true });
}

function parseFlags(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const value = args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : 'true';
    result[key] = value;
    if (value !== 'true') index += 1;
  }
  return result;
}

function record(type, fields) {
  ensureStore();
  const entry = {
    type,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  appendFileSync(storePath, `${JSON.stringify(entry)}\n`, 'utf8');
  console.log(JSON.stringify({ status: 'success', summary: `${type} recorded`, artifacts: [storePath] }, null, 2));
}

function query(kind) {
  if (!existsSync(storePath)) {
    console.log(JSON.stringify({ status: 'warning', summary: 'no records found', artifacts: [] }, null, 2));
    return;
  }
  const records = readFileSync(storePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const filtered = kind === 'all' ? records : records.filter((entry) => entry.type === kind.replace(/s$/, ''));
  console.log(JSON.stringify({ status: 'success', summary: `${filtered.length} records`, records: filtered }, null, 2));
}

const [command, maybeKind, ...rest] = process.argv.slice(2);
const flags = parseFlags(command === 'query' ? rest : [maybeKind, ...rest].filter(Boolean));

if (command === 'intake') {
  record('intake', {
    inputType: flags.type ?? 'unknown',
    summary: flags.summary ?? 'No summary provided',
    lane: flags.lane ?? 'normal',
  });
} else if (command === 'trace') {
  record('trace', {
    summary: flags.summary ?? 'No summary provided',
    outcome: flags.outcome ?? 'unknown',
  });
} else if (command === 'query') {
  query(maybeKind ?? 'all');
} else {
  console.log(`Usage:
  node scripts/bin/harness-cli.mjs intake --type user_story --summary "Login valid user" --lane high-risk
  node scripts/bin/harness-cli.mjs trace --summary "Generated login test" --outcome completed
  node scripts/bin/harness-cli.mjs query all|intakes|traces`);
}
