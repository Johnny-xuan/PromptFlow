import { invoke } from "@tauri-apps/api/core";

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
}

interface RawFileInfo {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
}

export const fileService = {
  async readFile(path: string): Promise<string> {
    return invoke<string>("read_file", { path });
  },

  async writeFile(path: string, content: string): Promise<void> {
    await invoke("write_file", { path, content });
  },

  async listFiles(dir: string, extension?: string): Promise<FileInfo[]> {
    const files = await invoke<RawFileInfo[]>("list_files", { dir, extension });
    return files.map((f) => ({
      name: f.name,
      path: f.path,
      size: f.size,
      modifiedAt: f.modifiedAt,
    }));
  },

  async deleteFile(path: string): Promise<void> {
    await invoke("delete_file", { path });
  },

  async fileExists(path: string): Promise<boolean> {
    return invoke<boolean>("file_exists", { path });
  },
};
