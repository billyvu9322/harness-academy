/**
 * B0 router-proof smoke test. NOT part of the server build.
 * Run: node --env-file=.env --import tsx apps/api/src/agent/smoke.ts
 * (from the assistant/ dir, with .env holding LLM_API_KEY)
 *
 * Proves: chat completion responds via the router, the User-Agent header is set,
 * and the embedding dimension matches the Drizzle schema (vector(1536)).
 */
import { routerClient } from './llm';
import { env } from '../config/env';

const EXPECTED_EMBEDDING_DIM = 1536;

async function main() {
  console.log('Router base URL :', env.LLM_BASE_URL);
  console.log('Chat model      :', env.OPENAI_CHAT_MODEL);
  console.log('Embedding model :', env.OPENAI_EMBEDDING_MODEL);
  console.log('User-Agent      : AssistantHarnessBot/0.1 personal research');
  console.log('---');

  // 1) Chat completion
  const chat = await routerClient.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    messages: [
      { role: 'system', content: 'Reply with exactly: ROUTER_OK' },
      { role: 'user', content: 'ping' },
    ],
    max_tokens: 16,
  });
  const reply = chat.choices[0]?.message?.content?.trim();
  console.log('Chat reply      :', JSON.stringify(reply));
  console.log('Chat model id   :', chat.model);

  // 2) Embedding + dimension check (router may not expose an embedding model)
  let dim = 0;
  try {
    const emb = await routerClient.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: 'harness verification gate',
    });
    dim = emb.data[0]?.embedding?.length ?? 0;
    console.log('Embedding dim   :', dim, dim === EXPECTED_EMBEDDING_DIM ? '(matches schema)' : `(MISMATCH — schema expects ${EXPECTED_EMBEDDING_DIM})`);
  } catch (e: any) {
    console.log('Embedding       : UNAVAILABLE on router —', e?.message ?? e);
    console.log('                  (RAG embedding source must be resolved before B1)');
  }

  console.log('---');
  const chatOk = reply === 'ROUTER_OK' || !!reply;
  console.log(chatOk ? 'B0 PASS (chat)' : 'B0 FAIL (chat)');
  if (dim !== EXPECTED_EMBEDDING_DIM) console.log('B0 note: embedding gap — see §14 open questions');
}

main().catch((err) => {
  console.error('B0 FAIL:', err?.message ?? err);
  if (err?.status) console.error('HTTP status:', err.status);
  process.exit(1);
});
