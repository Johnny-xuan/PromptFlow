import type { AppConfig, PolishPreset } from "../../types";
import { llmClient } from "./llmClient";

interface PolishRequest {
  input: string;
  preset: PolishPreset;
  config: AppConfig["api"];
  chatHistory?: Array<{ role: 'user' | 'assistant', content: string }>;
}

interface PolishResponse {
  output: string;
  error?: string;
}

// DEFAULT_BASE_URLS 已移至 apiUtils.ts
export { DEFAULT_BASE_URLS } from "./apiUtils";

export const aiService = {
  async polish(request: PolishRequest): Promise<PolishResponse> {
    const { input, preset, config } = request;

    if (!config.apiKey) {
      return { output: "", error: "请先在设置中配置 API Key" };
    }

    try {
      const chatHistory = request.chatHistory || [];

      // 在用户消息后注入任务提醒（仅对继续对话时）
      const userMessage = chatHistory.length > 0 ? input + TASK_REMINDER : input;

      // 构建消息列表：system + 历史对话 + 当前输入
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: preset.systemPrompt },
        ...chatHistory,
        { role: "user", content: userMessage },
      ];

      const res = await llmClient.chat({
        config,
        messages,
        model: config.model,
        temperature: preset.temperature ?? config.temperature ?? 0.7,
        maxTokens: config.maxTokens || 2000,
        timeoutMs: 60000,
      });

      return { output: res.content };
    } catch (err) {
      console.error("AI polish error:", err);
      return {
        output: "",
        error: err instanceof Error ? err.message : "AI 调用失败",
      };
    }
  },

  async testConnection(config: AppConfig["api"]): Promise<{ success: boolean; message: string }> {
    return llmClient.testConnection(config);
  },
};

// 续聊时的任务提醒
const TASK_REMINDER = "\n\n【这是对上一个润色结果的修改要求，请基于之前的 Prompt 进行调整，输出修改后的完整 Prompt】";
