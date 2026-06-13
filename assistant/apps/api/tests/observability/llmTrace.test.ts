import { describe, expect, test } from "vitest";
import {
  createLlmTraceScope,
  extractUsageSummary,
  traceLlmCall,
} from "../../src/observability/llmTrace";

describe("llmTrace", () => {
  test("extracts OpenAI Chat Completions usage including cached prompt tokens", () => {
    const usage = extractUsageSummary({
      prompt_tokens: 1200,
      completion_tokens: 80,
      total_tokens: 1280,
      prompt_tokens_details: { cached_tokens: 1024 },
    });

    expect(usage).toEqual({
      inputTokens: 1200,
      outputTokens: 80,
      totalTokens: 1280,
      cachedInputTokens: 1024,
    });
  });

  test("records only metadata and usage, never prompt bodies or secrets", async () => {
    const scope = createLlmTraceScope();

    await scope.run(async () => {
      await traceLlmCall(
        {
          endpoint: "chat.completions",
          request: {
            model: "cx/gpt-5.5",
            messages: [{ role: "user", content: "api key sk-secret prompt" }],
          },
        },
        async () => ({
          id: "chatcmpl_123",
          model: "cx/gpt-5.5",
          _request_id: "req_123",
          usage: {
            prompt_tokens: 12,
            completion_tokens: 4,
            total_tokens: 16,
          },
        }),
      );
    });

    expect(scope.calls).toHaveLength(1);
    expect(scope.calls[0]).toMatchObject({
      endpoint: "chat.completions",
      model: "cx/gpt-5.5",
      status: "ok",
      requestId: "req_123",
      inputTokens: 12,
      outputTokens: 4,
      totalTokens: 16,
    });
    expect(JSON.stringify(scope.calls)).not.toContain("sk-secret");
    expect(JSON.stringify(scope.calls)).not.toContain("api key");
    expect(JSON.stringify(scope.calls)).not.toContain("prompt");
  });

  test("records compact error summaries for failed LLM calls", async () => {
    const scope = createLlmTraceScope();

    await expect(
      scope.run(async () => {
        await traceLlmCall(
          { endpoint: "embeddings", request: { model: "text-embedding-3-small" } },
          async () => {
            throw new Error("router unavailable with api key sk-secret-token");
          },
        );
      }),
    ).rejects.toThrow("router unavailable");

    expect(scope.calls).toHaveLength(1);
    expect(scope.calls[0]).toMatchObject({
      endpoint: "embeddings",
      model: "text-embedding-3-small",
      status: "error",
    });
    expect(scope.calls[0]?.errorSummary).toBe("router unavailable with api key [REDACTED]");
    expect(JSON.stringify(scope.calls)).not.toContain("sk-secret-token");
  });

  test("redacts authorization and token-shaped error details", async () => {
    const scope = createLlmTraceScope();

    await expect(
      scope.run(async () => {
        await traceLlmCall(
          { endpoint: "chat.completions", request: { model: "cx/gpt-5.5" } },
          async () => {
            throw new Error(
              "upstream rejected Authorization: Bearer router-secret token=abc123",
            );
          },
        );
      }),
    ).rejects.toThrow("upstream rejected");

    expect(scope.calls[0]?.errorSummary).toBe(
      "upstream rejected Authorization: Bearer [REDACTED] token=[REDACTED]",
    );
    expect(JSON.stringify(scope.calls)).not.toContain("router-secret");
    expect(JSON.stringify(scope.calls)).not.toContain("abc123");
  });

  test("preserves OpenAI APIPromise helper methods when tracing", async () => {
    const promise = Promise.resolve({ usage: {} }) as Promise<unknown> & {
      withResponse: () => Promise<{ data: string }>;
      asResponse: () => Promise<Response>;
    };
    promise.withResponse = async () => ({ data: "ok" });
    promise.asResponse = async () => new Response("ok");

    const traced = traceLlmCall(
      { endpoint: "chat.completions", request: { model: "cx/gpt-5.5" } },
      () => promise,
    ) as typeof promise;

    expect(await traced.withResponse()).toEqual({ data: "ok" });
    expect(await traced.asResponse()).toBeInstanceOf(Response);
    await expect(traced).resolves.toEqual({ usage: {} });
  });
});
