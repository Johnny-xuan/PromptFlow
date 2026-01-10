import { useState, useEffect } from "react";
import type { AppConfig } from "../types";
import { configService } from "../services/configService";

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await configService.loadConfig();
      setConfig(data);
    } catch (err) {
      setError(String(err));
      console.error("Failed to load config:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    try {
      await configService.saveConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      setError(String(err));
      console.error("Failed to save config:", err);
      throw err;
    }
  };

  const updateUI = async (updates: Partial<AppConfig['ui']>) => {
    if (!config) return;
    const newConfig = { ...config, ui: { ...config.ui, ...updates } };
    await saveConfig(newConfig);
  };

  const updateAPI = async (updates: Partial<AppConfig['api']>) => {
    if (!config) return;
    const newConfig = { ...config, api: { ...config.api, ...updates } };
    await saveConfig(newConfig);
  };

  const updatePolish = async (updates: Partial<AppConfig['polish']>) => {
    if (!config) return;
    const newConfig = { ...config, polish: { ...config.polish, ...updates } };
    await saveConfig(newConfig);
  };

  const updateStorage = async (updates: Partial<AppConfig['storage']>) => {
    if (!config) return;
    const newConfig = { ...config, storage: { ...config.storage, ...updates } };
    await saveConfig(newConfig);
  };

  return {
    config,
    loading,
    error,
    reload: loadConfig,
    saveConfig,
    updateUI,
    updateAPI,
    updatePolish,
    updateStorage
  };
}
