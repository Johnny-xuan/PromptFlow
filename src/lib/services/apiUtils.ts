// API URL 处理工具 - 统一处理各 provider 的 endpoint 拼接逻辑

import type { APIConfig } from "../../types";

// 默认 base URL（不含 endpoint）
export const DEFAULT_BASE_URLS: Record<string, string> = {
  // 国际主流厂商
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  mistral: "https://api.mistral.ai/v1",
  grok: "https://api.x.ai/v1",
  cohere: "https://api.cohere.com/v1",
  perplexity: "https://api.perplexity.ai",
  openrouter: "https://openrouter.ai/api/v1",
  // 国内厂商
  deepseek: "https://api.deepseek.com/v1",
  moonshot: "https://api.moonshot.cn/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  ernie: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  minimax: "https://api.minimaxi.com/v1",
  yi: "https://api.lingyiwanwu.com/v1",
  doubao: "https://ark.cn-beijing.volces.com/api/v3",
};

// 各 provider 的 chat endpoint 后缀
const CHAT_ENDPOINTS: Record<string, string> = {
  // 国际厂商
  openai: "/chat/completions",
  anthropic: "/v1/messages",
  gemini: "/chat/completions",
  mistral: "/chat/completions",
  grok: "/chat/completions",
  cohere: "/chat/completions",
  perplexity: "/chat/completions",
  openrouter: "/chat/completions",
  // 国内厂商
  deepseek: "/chat/completions",
  moonshot: "/chat/completions",
  zhipu: "/chat/completions",
  ernie: "/completions",  // 百度文心一言使用不同的 endpoint
  qwen: "/chat/completions",
  minimax: "/chat/completions",
  yi: "/chat/completions",
  doubao: "/chat/completions",
  // 自定义
  custom: "/chat/completions",
};

/**
 * 获取完整的 API URL
 * 
 * 智能处理逻辑：
 * 1. 如果用户配置的 baseUrl 已经包含 endpoint（如 /chat/completions），直接使用
 * 2. 如果用户配置的 baseUrl 不包含 endpoint，根据 provider 自动拼接
 * 3. 如果用户未配置 baseUrl，使用默认值 + 自动拼接
 */
export function getChatCompletionUrl(config: APIConfig): string {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URLS[config.provider] || "";
  
  if (!baseUrl) {
    throw new Error("请配置 API Base URL");
  }

  // 判断 URL 是否已经包含 endpoint
  const hasEndpoint = 
    baseUrl.includes("/chat/completions") || 
    baseUrl.includes("/messages") ||
    baseUrl.includes("/generate");

  if (hasEndpoint) {
    // 用户配置了完整 URL，直接使用
    return baseUrl;
  }

  // 根据 provider 拼接正确的 endpoint
  const endpoint = CHAT_ENDPOINTS[config.provider] || "/chat/completions";
  
  // 确保不会出现双斜杠
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${cleanBase}${endpoint}`;
}

/**
 * 获取 base URL（用于需要手动拼接 endpoint 的场景）
 */
export function getBaseUrl(config: APIConfig): string {
  return config.baseUrl || DEFAULT_BASE_URLS[config.provider] || "";
}
