import type { APIConfig } from "../../types";
import { getChatCompletionUrl } from "./apiUtils";

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMChatRequest {
  config: APIConfig;
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  urlOverride?: string;
  retry?: {
    retries?: number;
    minDelayMs?: number;
    maxDelayMs?: number;
  };
}

export interface LLMChatResponse {
  content: string;
  raw: any;
}

export class LLMError extends Error {
  code: string;
  status?: number;

  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "LLMError";
    this.code = opts?.code || "LLM_ERROR";
    this.status = opts?.status;
  }
}

const LOG_ENABLED = typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.DEV);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError") ||
    (err instanceof Error && /aborted/i.test(err.message))
  );
}

function mapHttpStatusToCode(status: number): string {
  if (status === 401 || status === 403) return "AUTH_ERROR";
  if (status === 429) return "RATE_LIMIT";
  if (status >= 500) return "SERVER_ERROR";
  if (status >= 400) return "CLIENT_ERROR";
  return "HTTP_ERROR";
}

function getRetryAfterMs(response: Response): number | undefined {
  const v = response.headers.get("retry-after");
  if (!v) return undefined;

  const seconds = Number(v);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(60_000, seconds * 1000);
  }

  const date = Date.parse(v);
  if (!Number.isNaN(date)) {
    const ms = date - Date.now();
    if (ms > 0) return Math.min(60_000, ms);
  }

  return undefined;
}

function computeBackoffMs(attempt: number, minDelayMs: number, maxDelayMs: number): number {
  const exp = Math.min(maxDelayMs, minDelayMs * Math.pow(2, attempt));
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(maxDelayMs, exp + jitter);
}

function redactConfig(config: APIConfig) {
  return {
    provider: config.provider,
    model: config.model,
    hasApiKey: Boolean(config.apiKey),
    baseUrl: config.baseUrl ? "SET" : "DEFAULT",
  };
}

function createAbortSignal(timeoutMs: number | undefined, upstream?: AbortSignal): AbortSignal | undefined {
  if (!timeoutMs && !upstream) return undefined;

  const controller = new AbortController();

  let timer: number | undefined;
  if (timeoutMs && timeoutMs > 0) {
    timer = window.setTimeout(() => controller.abort(), timeoutMs);
  }

  if (upstream) {
    if (upstream.aborted) {
      if (timer) window.clearTimeout(timer);
      controller.abort();
    } else {
      upstream.addEventListener(
        "abort",
        () => {
          if (timer) window.clearTimeout(timer);
          controller.abort();
        },
        { once: true }
      );
    }
  }

  return controller.signal;
}

function extractSystemMessage(messages: LLMMessage[]): { system?: string; remaining: LLMMessage[] } {
  const idx = messages.findIndex((m) => m.role === "system");
  if (idx === -1) return { remaining: messages };

  const system = messages[idx].content;
  const remaining = messages.filter((_, i) => i !== idx);
  return { system, remaining };
}

function buildHeaders(config: APIConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.provider === "anthropic") {
    headers["x-api-key"] = config.apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  return headers;
}

function buildBody(request: LLMChatRequest, apiMessages: LLMMessage[], system?: string): object {
  const model = request.model || request.config.model;
  const maxTokens = request.maxTokens ?? request.config.maxTokens ?? 2000;
  const temperature = request.temperature ?? request.config.temperature ?? 0.7;

  if (request.config.provider === "anthropic") {
    const messages = apiMessages.map((m) => ({ role: m.role, content: m.content }));
    return {
      model,
      max_tokens: maxTokens,
      temperature,
      system: system || "",
      messages,
    };
  }

  const messages = apiMessages.map((m) => ({ role: m.role, content: m.content }));
  return {
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) return `HTTP ${response.status}`;

  try {
    const data = JSON.parse(text);
    return data?.error?.message || data?.message || text;
  } catch {
    return text;
  }
}

function parseContent(provider: APIConfig["provider"], data: any): string {
  if (provider === "anthropic") {
    return data?.content?.[0]?.text || "";
  }
  return data?.choices?.[0]?.message?.content || "";
}

export const llmClient = {
  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const { config } = request;

    if (!config.apiKey) {
      throw new LLMError("Missing API Key", { code: "MISSING_API_KEY" });
    }

    const url = request.urlOverride || getChatCompletionUrl(config);
    const startedAt = Date.now();

    const abortSignal = createAbortSignal(request.timeoutMs, request.signal);

    const { system, remaining } = extractSystemMessage(request.messages);

    const apiMessages =
      config.provider === "anthropic"
        ? remaining.filter((m) => m.role !== "system")
        : request.messages;

    const headers = buildHeaders(config);
    const body = buildBody(request, apiMessages, system);

    const retryCfg = {
      retries: request.retry?.retries ?? 2,
      minDelayMs: request.retry?.minDelayMs ?? 500,
      maxDelayMs: request.retry?.maxDelayMs ?? 8000,
    };

    if (LOG_ENABLED) {
      console.log("[PromptFlow] LLM request", {
        ...redactConfig(config),
        url: url ? "SET" : "EMPTY",
        messages: apiMessages.length,
        systemLength: system ? system.length : 0,
        retries: retryCfg.retries,
      });
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt <= retryCfg.retries; attempt++) {
      let response: Response | undefined;
      try {
        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: abortSignal,
        });

        const durationMs = Date.now() - startedAt;

        if (!response.ok) {
          const message = await readErrorMessage(response);
          const code = mapHttpStatusToCode(response.status);
          const err = new LLMError(message, { code, status: response.status });

          const retryableStatus = [429, 500, 502, 503, 504].includes(response.status);
          const canRetry = attempt < retryCfg.retries && retryableStatus;

          if (LOG_ENABLED) {
            console.error("[PromptFlow] LLM error", {
              ...redactConfig(config),
              status: response.status,
              code,
              durationMs,
              attempt,
              canRetry,
            });
          }

          if (!canRetry) {
            throw err;
          }

          const retryAfter = getRetryAfterMs(response);
          const backoff = retryAfter ?? computeBackoffMs(attempt, retryCfg.minDelayMs, retryCfg.maxDelayMs);
          await sleep(backoff, abortSignal);
          continue;
        }

        const data = await response.json().catch(() => ({}));
        const content = parseContent(config.provider, data);

        if (LOG_ENABLED) {
          console.log("[PromptFlow] LLM response", {
            ...redactConfig(config),
            status: response.status,
            durationMs,
            contentLength: content.length,
            attempt,
          });
        }

        return { content, raw: data };
      } catch (err) {
        lastErr = err;

        const durationMs = Date.now() - startedAt;

        if (isAbortError(err)) {
          const llmErr = new LLMError("Request timed out", { code: "TIMEOUT" });
          const canRetry = attempt < retryCfg.retries;

          if (LOG_ENABLED) {
            console.error("[PromptFlow] LLM timeout", {
              ...redactConfig(config),
              durationMs,
              attempt,
              canRetry,
            });
          }

          if (!canRetry) throw llmErr;
          const backoff = computeBackoffMs(attempt, retryCfg.minDelayMs, retryCfg.maxDelayMs);
          await sleep(backoff);
          continue;
        }

        if (err instanceof LLMError) {
          throw err;
        }

        const message = err instanceof Error ? err.message : "Network error";
        const llmErr = new LLMError(message, { code: "NETWORK_ERROR" });
        const canRetry = attempt < retryCfg.retries;

        if (LOG_ENABLED) {
          console.error("[PromptFlow] LLM network error", {
            ...redactConfig(config),
            durationMs,
            attempt,
            canRetry,
          });
        }

        if (!canRetry) throw llmErr;
        const backoff = computeBackoffMs(attempt, retryCfg.minDelayMs, retryCfg.maxDelayMs);
        await sleep(backoff, abortSignal);
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error("LLM request failed");
  },

  async testConnection(config: APIConfig): Promise<{ success: boolean; message: string }> {
    try {
      await llmClient.chat({
        config,
        messages: [{ role: "user", content: "Hi" }],
        maxTokens: 10,
        temperature: 0,
        timeoutMs: 15000,
      });
      return { success: true, message: "连接成功" };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "连接失败",
      };
    }
  },
};
