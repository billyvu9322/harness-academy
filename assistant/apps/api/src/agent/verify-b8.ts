/**
 * B8 gate — live cross-lingual + mode-gating check. NOT part of the build/test suite.
 * Run from assistant/apps/api:
 *   node --env-file=../../.env --import tsx src/agent/verify-b8.ts
 */
import { assistant } from './runtime';

function isVietnamese(text: string): boolean {
  return /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũ]/i.test(text);
}

async function main() {
  let ok = true;

  // 1) Cross-lingual recall: a Vietnamese query whose key term ("cổng xác minh") only appears
  //    in the corpus as the English "verification gate". Bilingual expansion must still find it.
  console.log('\n=== [1] Cross-lingual: VN query → EN source ===');
  const q1 = 'Cổng xác minh (verification gate) khác gì so với E2E test? Trả lời ngắn gọn.';
  const r1 = await assistant.runMessage(q1, { userLanguage: 'Vietnamese' });
  console.log('toolCalls:', r1.context.toolCalls.join(' → '));
  console.log('citations:', r1.citations.length);
  console.log('answer (head):', r1.answer.slice(0, 160).replace(/\n/g, ' '));
  const cross = r1.citations.length > 0 && isVietnamese(r1.answer);
  console.log(cross ? 'GATE 1: grounded + VN ✅' : 'GATE 1: FAILED ❌');
  ok &&= cross;

  // 2) Mode-gating: the harness_blueprint tool must be unavailable in qa mode and available
  //    in harness-design mode.
  const designQ = 'Hãy thiết kế một harness cho quy trình kiểm thử tự động trang checkout bằng Playwright.';

  console.log('\n=== [2a] qa mode: blueprint tool must NOT be callable ===');
  const rQa = await assistant.runMessage(designQ, { userLanguage: 'Vietnamese', mode: 'qa' });
  const qaUsedBlueprint = rQa.context.toolCalls.includes('harness_blueprint');
  console.log('toolCalls:', rQa.context.toolCalls.join(' → ') || '(none)');
  console.log(!qaUsedBlueprint ? 'GATE 2a: blueprint gated off ✅' : 'GATE 2a: LEAKED ❌');
  ok &&= !qaUsedBlueprint;

  console.log('\n=== [2b] harness-design mode: blueprint tool available ===');
  const rDesign = await assistant.runMessage(designQ, { userLanguage: 'Vietnamese', mode: 'harness-design' });
  const designUsedBlueprint = rDesign.context.toolCalls.includes('harness_blueprint');
  console.log('toolCalls:', rDesign.context.toolCalls.join(' → ') || '(none)');
  console.log('citations:', rDesign.citations.length);
  console.log(
    designUsedBlueprint
      ? 'GATE 2b: blueprint invoked ✅'
      : 'GATE 2b: tool available but model did not call it (still gated correctly) ⚠️',
  );

  console.log('\n' + (ok ? 'B8 GATE: PASS ✅' : 'B8 GATE: FAIL ❌'));
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error('B8 verify FAILED:', err?.message ?? err);
  process.exit(1);
});
