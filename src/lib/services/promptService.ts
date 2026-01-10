import { invoke } from "@tauri-apps/api/core";
import type { PromptItem } from "../../types";

export interface CreatePromptInput {
  title: string;
  content: string;
  tags: string[];
  description?: string;
  folder: "favorites" | "templates";
}

export interface UpdatePromptInput {
  title?: string;
  content?: string;
  tags?: string[];
  description?: string;
}

export const promptService = {
  async getDataDirectory(): Promise<string> {
    return invoke<string>("get_data_directory");
  },

  async getAllPrompts(): Promise<PromptItem[]> {
    const prompts = await invoke<RawPromptItem[]>("get_all_prompts");
    return prompts.map(normalizePromptItem);
  },

  async getFavorites(): Promise<PromptItem[]> {
    const prompts = await invoke<RawPromptItem[]>("get_favorites");
    return prompts.map(normalizePromptItem);
  },

  async getTemplates(): Promise<PromptItem[]> {
    const prompts = await invoke<RawPromptItem[]>("get_templates");
    return prompts.map(normalizePromptItem);
  },

  async createPrompt(input: CreatePromptInput): Promise<PromptItem> {
    const prompt = await invoke<RawPromptItem>("create_prompt", { input });
    return normalizePromptItem(prompt);
  },

  async updatePrompt(
    id: string,
    folder: string,
    updates: UpdatePromptInput
  ): Promise<PromptItem> {
    const prompt = await invoke<RawPromptItem>("update_prompt", {
      id,
      folder,
      updates,
    });
    return normalizePromptItem(prompt);
  },

  async deletePrompt(id: string, folder: string): Promise<void> {
    await invoke("delete_prompt", { id, folder });
  },

  async incrementUseCount(id: string, folder: string): Promise<PromptItem> {
    const prompt = await invoke<RawPromptItem>("increment_use_count", {
      id,
      folder,
    });
    return normalizePromptItem(prompt);
  },

  async exportDataDir(targetDir: string): Promise<string> {
    return invoke<string>("export_data_dir", { targetDir });
  },

  async initRepository(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      await invoke("init_repository", { path });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};

interface RawPromptItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  description?: string;
  useCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  filePath: string;
  folder: string;
}

function normalizePromptItem(raw: RawPromptItem): PromptItem {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    tags: raw.tags,
    description: raw.description,
    useCount: raw.useCount,
    lastUsed: raw.lastUsed ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    filePath: raw.filePath,
    folder: raw.folder as "favorites" | "templates",
  };
}
