import { AsyncLocalStorage } from "node:async_hooks";

export type LlmEndpoint = "chat.completions" | "embeddings";

export interface LlmCallTrace {
  endpoint: LlmEndpoint;
  model?: string;
  stream?: boolean;
  status: "ok" | "error";
  latencyMs: number;
  requestId?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
  errorSummary?: string;
}

export interface LlmTraceScope {
  calls: LlmCallTrace[];
  run<T>(fn: () => T | Promise<T>): Promise<T>;
}

interface LlmTraceStore {
  calls: LlmCallTrace[];
}

const storage = new AsyncLocalStorage<LlmTraceStore>();

export function createLlmTraceScope(): LlmTraceScope {
  const store: LlmTraceStore = { calls: [] };
  return {
    calls: store.calls,
    run: async <T>(fn: () => T | Promise<T>): Promise<T> =>
      storage.run(store, async () => fn()),
  };
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function extractUsageSummary(usage: unknown): Omit<
  LlmCallTrace,
  "endpoint" | "model" | "stream" | "status" | "latencyMs" | "requestId" | "errorSummary"
> {
  if (!usage || typeof usage !== "object") return {};
  const u = usage as Record<string, any>;
  return {
    inputTokens: numberValue(u.prompt_tokens ?? u.input_tokens),
    outputTokens: numberValue(u.completion_tokens ?? u.output_tokens),
    totalTokens: numberValue(u.total_tokens),
    cachedInputTokens: numberValue(
      u.prompt_tokens_details?.cached_tokens ??
        u.input_tokens_details?.cached_tokens ??
        u.cached_input_tokens,
    ),
  };
}

function requestModel(request: unknown): string | undefined {
  return request && typeof request === "object"
    ? String((request as Record<string, unknown>).model ?? "") || undefined
    : undefined;
}

function requestStream(request: unknown): boolean | undefined {
  return request && typeof request === "object"
    ? Boolean((request as Record<string, unknown>).stream)
    : undefined;
}

function responseRequestId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const r = response as Record<string, unknown>;
  return typeof r._request_id === "string"
    ? r._request_id
    : typeof r.request_id === "string"
      ? r.request_id
      : undefined;
}

function responseUsage(response: unknown): unknown {
  return response && typeof response === "object"
    ? (response as Record<string, unknown>).usage
    : undefined;
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function",
  );
}

function applyUsage(trace: LlmCallTrace, usage: unknown): void {
  const summary = extractUsageSummary(usage);
  if (summary.inputTokens !== undefined) trace.inputTokens = summary.inputTokens;
  if (summary.outputTokens !== undefined) trace.outputTokens = summary.outputTokens;
  if (summary.totalTokens !== undefined) trace.totalTokens = summary.totalTokens;
  if (summary.cachedInputTokens !== undefined) trace.cachedInputTokens = summary.cachedInputTokens;
}

function wrapUsageStream<T>(stream: AsyncIterable<T>, trace: LlmCallTrace): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of stream) {
        applyUsage(trace, responseUsage(chunk));
        yield chunk;
      }
    },
  };
}

function withStreamUsageOption(request: unknown): unknown {
  if (!request || typeof request !== "object") return request;
  const r = request as Record<string, any>;
  if (r.stream !== true) return request;
  return {
    ...r,
    stream_options: {
      ...(r.stream_options && typeof r.stream_options === "object" ? r.stream_options : {}),
      include_usage: true,
    },
  };
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(/(authorization\s*:\s*bearer\s+)([^\s,;]+)/gi, "$1[REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED]")
    .replace(
      /((?:x-api-key|api\s*key|api_key|token|secret|password)\s*[:=]?\s*)([^\s,;]+)/gi,
      "$1[REDACTED]",
    )
    .slice(0, 240);
}

function errorSummary(error: unknown): string {
  return redactSensitiveText(error instanceof Error ? error.message : String(error));
}

function copyPromiseHelpers<T>(source: unknown, target: Promise<T>): Promise<T> {
  if (!source || typeof source !== "object") return target;
  const s = source as Record<string, unknown>;
  const t = target as unknown as Record<string, unknown>;
  for (const key of ["withResponse", "asResponse"] as const) {
    const value = s[key];
    if (typeof value === "function") {
      t[key] = (...args: unknown[]) => value.apply(source, args);
    }
  }
  return target;
}

export function traceLlmCall<T>(
  args: { endpoint: LlmEndpoint; request: unknown },
  call: () => T | Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  let responsePromise: T | Promise<T>;
  try {
    responsePromise = call();
  } catch (error) {
    storage.getStore()?.calls.push({
      endpoint: args.endpoint,
      model: requestModel(args.request),
      stream: requestStream(args.request),
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorSummary: errorSummary(error),
    });
    throw error;
  }

  const traced = Promise.resolve(responsePromise).then(
    (response) => {
      const trace: LlmCallTrace = {
        endpoint: args.endpoint,
        model: requestModel(args.request),
        stream: requestStream(args.request),
        status: "ok",
        latencyMs: Date.now() - startedAt,
        requestId: responseRequestId(response),
      };
      applyUsage(trace, responseUsage(response));
      storage.getStore()?.calls.push(trace);
      if (trace.stream && isAsyncIterable(response)) {
        return wrapUsageStream(response, trace) as T;
      }
      return response;
    },
    (error) => {
      storage.getStore()?.calls.push({
        endpoint: args.endpoint,
        model: requestModel(args.request),
        stream: requestStream(args.request),
        status: "error",
        latencyMs: Date.now() - startedAt,
        errorSummary: errorSummary(error),
      });
      throw error;
    },
  );

  return copyPromiseHelpers(responsePromise, traced);
}

export function instrumentOpenAIClient<TClient extends Record<string, any>>(
  client: TClient,
): TClient {
  const chatCompletions = client.chat?.completions;
  const chatCreate = chatCompletions?.create?.bind(chatCompletions);
  if (chatCreate) {
    client.chat.completions.create = (request: unknown, ...rest: unknown[]) =>
      traceLlmCall({ endpoint: "chat.completions", request }, () =>
        chatCreate(withStreamUsageOption(request), ...rest),
      );
  }

  const embeddings = client.embeddings;
  const embeddingCreate = embeddings?.create?.bind(embeddings);
  if (embeddingCreate) {
    client.embeddings.create = (request: unknown, ...rest: unknown[]) =>
      traceLlmCall({ endpoint: "embeddings", request }, () =>
        embeddingCreate(request, ...rest),
      );
  }

  return client;
}
