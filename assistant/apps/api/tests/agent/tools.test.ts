import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunContext } from '@openai/agents';
import { buildDocIndex, type DocIndex } from '../../src/docs/index';
import { createDocsTools } from '../../src/agent/tools';

let root: string;
let index: DocIndex;
let tools: ReturnType<typeof createDocsTools>;

const LECTURE = `---
title: "Bài 03 — Verification"
---

## Verification gate

Verification gate chặn agent tuyên bố hoàn thành khi chưa chạy test.
`;

async function call(tool: { invoke: (ctx: RunContext, input: string) => unknown }, args: unknown) {
  const out = await tool.invoke(new RunContext({}), JSON.stringify(args));
  return typeof out === 'string' ? JSON.parse(out) : out;
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'tools-'));
  const full = join(root, 'academy/content/lectures/03-verify.md');
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, LECTURE);
  index = buildDocIndex(root);
  tools = createDocsTools(() => index);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('createDocsTools', () => {
  test('exposes the docs tools plus the gated blueprint tool', () => {
    expect(tools.listDocsTool.name).toBe('list_docs');
    expect(tools.grepDocsTool.name).toBe('grep_docs');
    expect(tools.readDocSectionTool.name).toBe('read_doc_section');
    expect(tools.harnessBlueprintTool.name).toBe('harness_blueprint');
  });

  test('list_docs returns the TOC', async () => {
    const out = await call(tools.listDocsTool, {});
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].title).toBe('Bài 03 — Verification');
    expect(out[0].headings).toContain('Verification gate');
  });

  test('grep_docs returns ranked matches', async () => {
    const out = await call(tools.grepDocsTool, { pattern: 'verification gate' });
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].route).toBe('/lectures/03-verify');
  });

  test('read_doc_section returns exact section text', async () => {
    const docId = index[0]!.docId;
    const out = await call(tools.readDocSectionTool, { docId, heading: 'Verification gate' });
    expect(out.heading).toBe('Verification gate');
    expect(out.text).toContain('chặn agent tuyên bố');
  });

  test('read_doc_section reports not-found instead of throwing on a forged docId', async () => {
    const out = await call(tools.readDocSectionTool, { docId: '../../../etc/passwd' });
    expect(out.found).toBe(false);
  });

  test('grep_docs finds an EN source line from a VN query via bilingual expansion', async () => {
    const out = await call(tools.grepDocsTool, { pattern: 'cổng xác minh' });
    expect(out.length).toBeGreaterThan(0);
    expect(out.some((m: { line: string }) => m.line.toLowerCase().includes('verification gate'))).toBe(true);
  });

  test('harness_blueprint is enabled only in harness-design mode', async () => {
    const isEnabled = tools.harnessBlueprintTool.isEnabled;
    const ctx = (mode: string) => new RunContext({ reads: [], toolCalls: [], mode });
    expect(await isEnabled(ctx('harness-design'), {} as never)).toBe(true);
    expect(await isEnabled(ctx('qa'), {} as never)).toBe(false);
  });

  test('harness_blueprint returns the primitive skeleton', async () => {
    const out = await call(tools.harnessBlueprintTool, { workflow: 'kiểm thử checkout' });
    expect(out.workflow).toBe('kiểm thử checkout');
    expect(out.sections.map((s: { key: string }) => s.key)).toContain('feature_list');
  });
});
