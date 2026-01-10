use crate::models::AppConfig;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn get_config_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let document_dir = tauri::path::BaseDirectory::Document;
    let data_dir = app_handle
        .path()
        .resolve("PromptFlow", document_dir)
        .map_err(|e| format!("Failed to resolve data directory: {}", e))?;
    
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    Ok(data_dir.join("config.json"))
}

#[tauri::command]
pub async fn load_config(app_handle: AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    if !config_path.exists() {
        let default_config = AppConfig::default();
        let json = serde_json::to_string_pretty(&default_config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
        fs::write(&config_path, json)
            .map_err(|e| format!("Failed to write config: {}", e))?;
        return Ok(default_config);
    }
    
    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let config: AppConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    Ok(config)
}

#[tauri::command]
pub async fn save_config(app_handle: AppHandle, config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path(&app_handle)?;
    
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn reset_config(app_handle: AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    let default_config = AppConfig::default();
    
    let json = serde_json::to_string_pretty(&default_config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(default_config)
}

#[tauri::command]
pub async fn get_api_key(app_handle: AppHandle) -> Result<String, String> {
    let config = load_config(app_handle).await?;
    Ok(config.api.api_key)
}

#[tauri::command]
pub async fn set_api_key(app_handle: AppHandle, api_key: String) -> Result<(), String> {
    let mut config = load_config(app_handle.clone()).await?;
    config.api.api_key = api_key;
    save_config(app_handle, config).await
}
