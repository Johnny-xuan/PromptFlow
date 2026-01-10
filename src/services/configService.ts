import { invoke } from "@tauri-apps/api/core";
import type { AppConfig } from "../types";

export const configService = {
  async loadConfig(): Promise<AppConfig> {
    return invoke("load_config");
  },

  async saveConfig(config: AppConfig): Promise<void> {
    return invoke("save_config", { config });
  },

  async resetConfig(): Promise<AppConfig> {
    return invoke("reset_config");
  },

  async getApiKey(): Promise<string> {
    return invoke("get_api_key");
  },

  async setApiKey(apiKey: string): Promise<void> {
    return invoke("set_api_key", { apiKey });
  }
};
