import type { AppConfig, PolishPreset, UIConfig } from "../../types";
import { llmClient } from "./llmClient";

interface PolishRequest {
  input: string;
  preset: PolishPreset;
  config: AppConfig["api"];
  chatHistory?: Array<{ role: 'user' | 'assistant', content: string }>;
  language?: UIConfig["language"];
}

interface PolishResponse {
  output: string;
  error?: string;
}

// DEFAULT_BASE_URLS 已移至 apiUtils.ts
export { DEFAULT_BASE_URLS } from "./apiUtils";

// Language instruction to append to system prompt
const getLanguageInstruction = (language: UIConfig["language"] | undefined): string => {
  if (language === 'en') {
    return '\n\n【Language Requirement】Please respond in English. All output should be in English.';
  }
  return ''; // Default: no instruction (Chinese prompts work as-is)
};

// Task reminder for follow-up conversations
const getTaskReminder = (language: UIConfig["language"] | undefined): string => {
  if (language === 'en') {
    return '\n\n[This is a modification request based on the previous result. Please adjust the previous Prompt accordingly and output the complete modified Prompt.]';
  }
  return '\n\n【这是对上一个润色结果的修改要求，请基于之前的 Prompt 进行调整，输出修改后的完整 Prompt】';
};

export const aiService = {
  async polish(request: PolishRequest): Promise<PolishResponse> {
    const { input, preset, config, language } = request;

    if (!config.apiKey) {
      return { output: "", error: language === 'en' ? "Please configure API Key in settings first" : "请先在设置中配置 API Key" };
    }

    try {
      const chatHistory = request.chatHistory || [];

      // Append language instruction to system prompt
      const systemPromptWithLang = preset.systemPrompt + getLanguageInstruction(language);

      // Add task reminder for follow-up conversations
      const taskReminder = getTaskReminder(language);
      const userMessage = chatHistory.length > 0 ? input + taskReminder : input;

      // Build message list: system + chat history + current input
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPromptWithLang },
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
