NODE_ENV=production
PORT=5001
LLM_BASE_URL=https://9router.nimo.io.vn/v1
LLM_API_KEY=sk-6931b07912115a47-z9wxaq-4b84bde8
DATABASE_URL=postgres://postgres:postgres@localhost:5433/harness_assistant
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=cx/gpt-5.5
WEB_ORIGINS=https://harness-academy.nimo.io.vn
VITE_API_BASE_URL=https://api-harness-academy.nimo.io.vn
VITE_ACADEMY_BASE_URL=https://harness-academy.nimo.io.vn

NODE_ENV=development
LLM_BASE_URL=https://9router.nimo.io.vn/v1
LLM_API_KEY=sk-6931b07912115a47-z9wxaq-4b84bde8
DATABASE_URL=postgres://postgres:postgres@localhost:5433/harness_assistant
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=cx/gpt-5.5
PORT=5001
# CORS allowlist (comma-separated): web app + academy site.
WEB_ORIGINS=http://localhost:5173,http://localhost:5174
VITE_API_BASE_URL=http://localhost:5001
VITE_ACADEMY_BASE_URL=http://localhost:5173
