import { useState, useEffect, useCallback } from "react";
import type { PromptItem, CreatePromptInput, UpdatePromptInput } from "../types";
import { promptManager } from "../services/promptManager";

export function usePrompts() {
  const [favorites, setFavorites] = useState<PromptItem[]>([]);
  const [templates, setTemplates] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const [favs, temps] = await Promise.all([
        promptManager.getFavorites(),
        promptManager.getTemplates()
      ]);
      setFavorites(favs);
      setTemplates(temps);
    } catch (err) {
      setError(String(err));
      console.error("Failed to load prompts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const createPrompt = async (input: CreatePromptInput) => {
    try {
      await promptManager.createPrompt(input);
      await loadPrompts(); // Reload to get updated list
    } catch (err) {
      console.error("Failed to create prompt:", err);
      throw err;
    }
  };

  const updatePrompt = async (id: string, folder: string, updates: UpdatePromptInput) => {
    try {
      await promptManager.updatePrompt(id, folder, updates);
      await loadPrompts();
    } catch (err) {
      console.error("Failed to update prompt:", err);
      throw err;
    }
  };

  const deletePrompt = async (id: string, folder: string) => {
    try {
      await promptManager.deletePrompt(id, folder);
      await loadPrompts();
    } catch (err) {
      console.error("Failed to delete prompt:", err);
      throw err;
    }
  };

  const incrementUseCount = async (id: string, folder: string) => {
    try {
      await promptManager.incrementUseCount(id, folder);
      // Optimistic update
      if (folder === 'favorites') {
        setFavorites(prev => prev.map(p => p.id === id ? { ...p, useCount: p.useCount + 1 } : p));
      } else {
        setTemplates(prev => prev.map(p => p.id === id ? { ...p, useCount: p.useCount + 1 } : p));
      }
    } catch (err) {
      console.error("Failed to increment use count:", err);
    }
  };

  return {
    favorites,
    templates,
    loading,
    error,
    reload: loadPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    incrementUseCount
  };
}
