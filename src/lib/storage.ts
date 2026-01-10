import { BaseDirectory, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

const BASE_DIR = "PromptFlow";
const FAVORITES_DIR = "favorites";
const TEMPLATES_DIR = "templates";

// Ensure directories exist
async function ensureDirectories() {
  try {
    const baseExists = await exists(BASE_DIR, { baseDir: BaseDirectory.Document });
    if (!baseExists) {
      await mkdir(BASE_DIR, { baseDir: BaseDirectory.Document });
    }

    const favExists = await exists(`${BASE_DIR}/${FAVORITES_DIR}`, { baseDir: BaseDirectory.Document });
    if (!favExists) {
      await mkdir(`${BASE_DIR}/${FAVORITES_DIR}`, { baseDir: BaseDirectory.Document });
    }

    const tempExists = await exists(`${BASE_DIR}/${TEMPLATES_DIR}`, { baseDir: BaseDirectory.Document });
    if (!tempExists) {
      await mkdir(`${BASE_DIR}/${TEMPLATES_DIR}`, { baseDir: BaseDirectory.Document });
    }
  } catch (err) {
    console.error("Failed to ensure directories:", err);
  }
}

export const storage = {
  async init() {
    await ensureDirectories();
  },

  async savePrompt(content: string, _type: 'favorite' | 'template', title?: string): Promise<boolean> {
    try {
      await ensureDirectories();
      
      const defaultName = `prompt-${Date.now()}.md`;
      const fileName = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md` : defaultName;
      
      const filePath = await save({
        defaultPath: fileName,
        title: "Save Prompt",
        filters: [{
          name: "Markdown",
          extensions: ["md"]
        }]
      });

      if (!filePath) return false; // User cancelled

      // For now we just write to the selected path, 
      // in the future we might want to force it into our specific directories
      // or use the path returned by the dialog.
      
      // Note: The 'save' dialog returns a full system path. 
      // 'writeTextFile' without baseDir uses absolute path.
      await writeTextFile(filePath, content);
      return true;
    } catch (err) {
      console.error("Failed to save prompt:", err);
      return false;
    }
  },

  async loadFavorites(): Promise<PromptItem[]> {
    // TODO: Implement listing files from FAVORITES_DIR
    return [];
  }
};
