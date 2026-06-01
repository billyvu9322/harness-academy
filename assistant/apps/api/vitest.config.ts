import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // env.ts requires LLM_API_KEY at import. Tests never call the live router
    // (that's the smoke/verify scripts), so a dummy key is fine here.
    env: {
      LLM_API_KEY: 'test-key',
    },
  },
});
