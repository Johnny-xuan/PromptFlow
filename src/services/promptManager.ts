import { invoke } from "@tauri-apps/api/core";
import type { PromptItem, CreatePromptInput, UpdatePromptInput } from "../types";

export const promptManager = {
  async getAllPrompts(): Promise<PromptItem[]> {
    return invoke("get_all_prompts");
  },

  async getFavorites(): Promise<PromptItem[]> {
    return invoke("get_favorites");
  },

  async getTemplates(): Promise<PromptItem[]> {
    return invoke("get_templates");
  },

  async createPrompt(input: CreatePromptInput): Promise<PromptItem> {
    return invoke("create_prompt", { input });
  },

  async updatePrompt(id: string, folder: string, updates: UpdatePromptInput): Promise<PromptItem> {
    return invoke("update_prompt", { id, folder, updates });
  },

  async deletePrompt(id: string, folder: string): Promise<void> {
    return invoke("delete_prompt", { id, folder });
  },

  async incrementUseCount(id: string, folder: string): Promise<PromptItem> {
    return invoke("increment_use_count", { id, folder });
  }
};
