import type { APIConfig } from "../../types";
import type { ClarificationQuestion } from "../../types/intent";
import { llmClient } from "./llmClient";
import { parseJsonFromModelOutput } from "./jsonTools";

export class StructuredOutputError extends Error {
  code: string;
  details?: string;

  constructor(message: string, opts?: { code?: string; details?: string }) {
    super(message);
    this.name = "StructuredOutputError";
    this.code = opts?.code || "STRUCTURED_OUTPUT_ERROR";
    this.details = opts?.details;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function validatePresetCreatorOutput(data: unknown): {
  name?: string;
  description?: string;
  icon?: string;
  temperature?: number;
  systemPrompt: string;
} {
  if (!isRecord(data)) {
    throw new StructuredOutputError("Output must be a JSON object", { code: "SCHEMA_ERROR" });
  }

  const systemPrompt = typeof data.systemPrompt === "string" ? data.systemPrompt.trim() : "";
  if (!systemPrompt) {
    throw new StructuredOutputError("Missing required field: systemPrompt", { code: "SCHEMA_ERROR" });
  }

  const name = typeof data.name === "string" ? data.name.trim() : undefined;
  const description = typeof data.description === "string" ? data.description.trim() : undefined;
  const icon = typeof data.icon === "string" ? data.icon.trim() : undefined;

  let temperature: number | undefined;
  if (typeof data.temperature === "number" && Number.isFinite(data.temperature)) {
    temperature = Math.min(1, Math.max(0, data.temperature));
  }

  return { name, description, icon, temperature, systemPrompt };
}

export function validateCheckerAnalyzeOutput(data: unknown): {
  isClear: boolean;
  problems?: string[];
  questions?: ClarificationQuestion[];
  reason?: string;
} {
  if (!isRecord(data)) {
    throw new StructuredOutputError("Output must be a JSON object", { code: "SCHEMA_ERROR" });
  }

  if (typeof data.isClear !== "boolean") {
    throw new StructuredOutputError("Missing/invalid field: isClear (boolean)", { code: "SCHEMA_ERROR" });
  }

  if (data.questions !== undefined && !Array.isArray(data.questions)) {
    throw new StructuredOutputError("Invalid field: questions (must be array)", { code: "SCHEMA_ERROR" });
  }

  if (data.problems !== undefined && !Array.isArray(data.problems)) {
    throw new StructuredOutputError("Invalid field: problems (must be array)", { code: "SCHEMA_ERROR" });
  }

  const reason = typeof data.reason === "string" ? data.reason : undefined;
  const problems = Array.isArray(data.problems) ? (data.problems.filter((p) => typeof p === "string") as string[]) : undefined;

  let questions: ClarificationQuestion[] | undefined;
  if (Array.isArray(data.questions)) {
    questions = data.questions.map((q, idx) => {
      if (!isRecord(q)) {
        throw new StructuredOutputError(`Invalid question at index ${idx} (must be object)`, { code: "SCHEMA_ERROR" });
      }

      const id = typeof q.id === "string" ? q.id.trim() : "";
      const question = typeof q.question === "string" ? q.question.trim() : "";
      if (!id) {
        throw new StructuredOutputError(`Invalid question at index ${idx}: missing id`, { code: "SCHEMA_ERROR" });
      }
      if (!question) {
        throw new StructuredOutputError(`Invalid question at index ${idx}: missing question`, { code: "SCHEMA_ERROR" });
      }

      const type = q.type === "multiple" || q.type === "single" ? (q.type as "single" | "multiple") : undefined;

      if (!Array.isArray(q.options) || q.options.length === 0) {
        throw new StructuredOutputError(`Invalid question at index ${idx}: options must be a non-empty array`, {
          code: "SCHEMA_ERROR",
        });
      }

      const options = q.options.map((o, oIdx) => {
        if (!isRecord(o)) {
          throw new StructuredOutputError(`Invalid option at questions[${idx}].options[${oIdx}]`, { code: "SCHEMA_ERROR" });
        }

        const optId = typeof o.id === "string" ? o.id.trim() : "";
        const label = typeof o.label === "string" ? o.label.trim() : "";
        if (!optId || !label) {
          throw new StructuredOutputError(`Invalid option at questions[${idx}].options[${oIdx}]: missing id/label`, {
            code: "SCHEMA_ERROR",
          });
        }

        const icon = typeof o.icon === "string" ? o.icon : undefined;
        const description = typeof o.description === "string" ? o.description : undefined;
        const allowCustomInput = typeof o.allowCustomInput === "boolean" ? o.allowCustomInput : undefined;

        return {
          id: optId,
          label,
          icon,
          description,
          allowCustomInput,
        };
      });

      return {
        id,
        question,
        type,
        options,
      };
    });
  }

  return {
    isClear: data.isClear,
    problems,
    questions,
    reason,
  };
}

export interface ParseStructuredOutputOptions {
  apiConfig: APIConfig;
  timeoutMs?: number;
  repair?: {
    enabled?: boolean;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  };
}

const JSON_REPAIR_SYSTEM_PROMPT = `你是一个严格的 JSON 修复器。

你的任务：
- 把用户提供的文本修复为“合法 JSON”
- 只能输出 JSON（不要 Markdown，不要解释，不要额外文字）

规则：
- 只返回一个 JSON 值（对象或数组）
- 不能包含三连反引号
- 不要改变语义，只修复格式问题（引号、逗号、转义、截断等）`;

export async function parseStructuredOutput<T>(
  text: string,
  validate: (data: unknown) => T,
  options: ParseStructuredOutputOptions
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 60000;
  const repairEnabled = options.repair?.enabled ?? true;

  try {
    const parsed = parseJsonFromModelOutput<unknown>(text);
    return validate(parsed);
  } catch (err) {
    const firstMessage = err instanceof Error ? err.message : String(err);

    if (!repairEnabled) {
      throw new StructuredOutputError("Failed to parse/validate JSON output", {
        code: "PARSE_ERROR",
        details: firstMessage,
      });
    }

    const repair = await llmClient.chat({
      config: options.apiConfig,
      messages: [
        { role: "system", content: JSON_REPAIR_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      model: options.repair?.model ?? options.apiConfig.model,
      temperature: options.repair?.temperature ?? 0,
      maxTokens: options.repair?.maxTokens ?? 1200,
      timeoutMs,
    });

    try {
      const parsed2 = parseJsonFromModelOutput<unknown>(repair.content);
      return validate(parsed2);
    } catch (err2) {
      const secondMessage = err2 instanceof Error ? err2.message : String(err2);
      throw new StructuredOutputError("Failed to parse/validate JSON output after repair", {
        code: "REPAIR_FAILED",
        details: `${firstMessage}; repair: ${secondMessage}`,
      });
    }
  }
}
