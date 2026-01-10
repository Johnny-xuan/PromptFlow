use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub ui: UIConfig,
    pub api: APIConfig,
    pub polish: PolishConfig,
    pub storage: StorageConfig,
    #[serde(default)]
    pub onboarding_completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UIConfig {
    pub hotkey: String,
    pub close_after_copy: bool,
    pub remember_position: bool,
    pub window_position: String,
    pub theme: String,
    pub font_size: u32,
    pub opacity: u32,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct APIConfig {
    pub provider: String,
    pub api_key: String,
    pub model: String,
    pub temperature: f64,
    pub max_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PolishConfig {
    pub current_preset: String,
    pub presets: Vec<PolishPreset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PolishPreset {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    pub system_prompt: String,
    pub is_built_in: bool,
    pub is_default: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageConfig {
    pub path: String,
    pub format: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            ui: UIConfig {
                hotkey: "CommandOrControl+Shift+P".to_string(),
                close_after_copy: true,
                remember_position: true,
                window_position: "center".to_string(),
                theme: "dark".to_string(),
                font_size: 14,
                opacity: 100,
                language: "zh-CN".to_string(),
            },
            api: APIConfig {
                provider: "deepseek".to_string(),
                api_key: String::new(),
                model: "deepseek-chat".to_string(),
                temperature: 0.7,
                max_tokens: 2000,
                base_url: None,
            },
            polish: PolishConfig {
                current_preset: "default".to_string(),
                presets: vec![],
            },
            storage: StorageConfig {
                path: String::new(),  // 空，用户通过引导设置
                format: "markdown".to_string(),
            },
            onboarding_completed: false,
        }
    }
}
