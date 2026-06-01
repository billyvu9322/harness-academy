/**
 * B3 gate — live golden-question check against the real router. NOT part of the build/test suite.
 * Run from assistant/apps/api:
 *   node --env-file=../../.env --import tsx src/agent/verify-b3.ts
 */
import { assistant } from './runtime';

const GOLDEN = [
  'Feature list là gì?',
  'Verification gate khác E2E test như thế nào?',
];

async function main() {
  for (const q of GOLDEN) {
    console.log('\n=== Q:', q, '===');
    const { answer, citations } = await assistant.runMessage(q, { userLanguage: 'Vietnamese' });
    console.log('ANSWER:\n' + answer);
    console.log('CITATIONS (' + citations.length + '):');
    for (const c of citations) console.log('  -', c.title, c.route ?? c.sourcePath, c.sectionHeading ? `:: ${c.sectionHeading}` : '');
    console.log(citations.length > 0 ? 'GATE: grounded ✅' : 'GATE: NO CITATION ❌');
  }
}

main().catch((err) => {
  console.error('B3 verify FAILED:', err?.message ?? err);
  process.exit(1);
});
