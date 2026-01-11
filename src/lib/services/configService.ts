import { invoke } from "@tauri-apps/api/core";
import type { AppConfig } from "../../types";

interface RawAppConfig {
  ui: {
    hotkey: string;
    closeAfterCopy: boolean;
    rememberPosition: boolean;
    windowPosition: string;
    theme: string;
    fontSize: number;
    opacity: number;
    language: string;
  };
  api: {
    provider: string;
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    baseUrl?: string;
  };
  polish: {
    currentPreset: string;
    presets: Array<{
      id: string;
      name: string;
      description?: string;
      icon?: string;
      systemPrompt: string;
      isBuiltIn: boolean;
      isDefault: boolean;
      temperature?: number;
    }>;
  };
  storage: {
    path: string;
    format: string;
  };
  onboardingCompleted?: boolean;
}

// Get platform-specific hotkey
function getPlatformHotkey(): string {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) {
    return "Option+Space";
  }
  return "Ctrl+Space"; // Windows/Linux
}

// Migrate old hotkey values to new platform-specific ones
function migrateHotkey(oldHotkey: string): string {
  const legacyHotkeys = [
    "Alt+Space",
    "CommandOrControl+Shift+P",
    "Command+Shift+P",
    "Ctrl+Shift+P",
  ];
  if (legacyHotkeys.includes(oldHotkey)) {
    return getPlatformHotkey();
  }
  return oldHotkey;
}

function normalizeConfig(raw: RawAppConfig): AppConfig {
  return {
    ui: {
      hotkey: migrateHotkey(raw.ui.hotkey),
      closeAfterCopy: raw.ui.closeAfterCopy,
      rememberPosition: raw.ui.rememberPosition,
      windowPosition: raw.ui.windowPosition as "center" | "cursor" | "fixed",
      theme: raw.ui.theme as "light" | "dark" | "system",
      fontSize: raw.ui.fontSize,
      opacity: raw.ui.opacity,
      language: raw.ui.language as "zh-CN" | "en",
    },
    api: {
      provider: raw.api.provider as "openai" | "anthropic" | "deepseek" | "custom",
      apiKey: raw.api.apiKey,
      model: raw.api.model,
      temperature: raw.api.temperature,
      maxTokens: raw.api.maxTokens,
      baseUrl: raw.api.baseUrl,
    },
    polish: {
      currentPreset: raw.polish.currentPreset,
      presets: raw.polish.presets.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        icon: p.icon,
        systemPrompt: p.systemPrompt,
        isBuiltIn: p.isBuiltIn,
        isDefault: p.isDefault,
        temperature: p.temperature,
      })),
    },
    storage: {
      path: raw.storage.path,
      format: raw.storage.format as "markdown" | "json" | "both",
    },
    onboardingCompleted: raw.onboardingCompleted ?? false,
  };
}

function denormalizeConfig(config: AppConfig): RawAppConfig {
  return {
    ui: {
      hotkey: config.ui.hotkey,
      closeAfterCopy: config.ui.closeAfterCopy,
      rememberPosition: config.ui.rememberPosition,
      windowPosition: config.ui.windowPosition,
      theme: config.ui.theme,
      fontSize: config.ui.fontSize,
      opacity: config.ui.opacity,
      language: config.ui.language,
    },
    api: {
      provider: config.api.provider,
      apiKey: config.api.apiKey,
      model: config.api.model,
      temperature: config.api.temperature,
      maxTokens: config.api.maxTokens,
      baseUrl: config.api.baseUrl,
    },
    polish: {
      currentPreset: config.polish.currentPreset,
      presets: config.polish.presets.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        icon: p.icon,
        systemPrompt: p.systemPrompt,
        isBuiltIn: p.isBuiltIn,
        isDefault: p.isDefault,
        temperature: p.temperature,
      })),
    },
    storage: {
      path: config.storage.path,
      format: config.storage.format,
    },
    onboardingCompleted: config.onboardingCompleted,
  };
}

export const configService = {
  async loadConfig(): Promise<AppConfig> {
    const raw = await invoke<RawAppConfig>("load_config");
    return normalizeConfig(raw);
  },

  async saveConfig(config: AppConfig): Promise<void> {
    const raw = denormalizeConfig(config);
    await invoke("save_config", { config: raw });
  },

  async resetConfig(): Promise<AppConfig> {
    const raw = await invoke<RawAppConfig>("reset_config");
    return normalizeConfig(raw);
  },

  async getApiKey(): Promise<string> {
    return invoke<string>("get_api_key");
  },

  async setApiKey(apiKey: string): Promise<void> {
    await invoke("set_api_key", { api_key: apiKey });
  },
};
