import { invoke } from "@tauri-apps/api/core";

export const windowService = {
  async toggle(): Promise<void> {
    await invoke("toggle_window");
  },

  async show(): Promise<void> {
    await invoke("show_window");
  },

  async hide(): Promise<void> {
    await invoke("hide_window");
  },

  async setPosition(x: number, y: number): Promise<void> {
    await invoke("set_window_position", { x, y });
  },

  async getPosition(): Promise<{ x: number; y: number }> {
    const [x, y] = await invoke<[number, number]>("get_window_position");
    return { x, y };
  },

  async setSize(width: number, height: number): Promise<void> {
    await invoke("set_window_size", { width, height });
  },

  async center(): Promise<void> {
    await invoke("center_window");
  },

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    await invoke("set_always_on_top", { alwaysOnTop });
  },

  async minimize(): Promise<void> {
    await invoke("minimize_window");
  },

  async close(): Promise<void> {
    await invoke("close_window");
  },
};
