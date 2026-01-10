use crate::models::{AppConfig, CreatePromptInput, FileInfo, PromptItem, UpdatePromptInput};
use crate::utils::{generate_timestamp, parse_markdown_prompt, serialize_markdown_prompt, AppError};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

fn get_config_path(app_handle: &AppHandle) -> Result<PathBuf, AppError> {
    let document_dir = tauri::path::BaseDirectory::Document;
    let data_dir = app_handle
        .path()
        .resolve("PromptFlow", document_dir)
        .map_err(|e| AppError::io_error(format!("Failed to resolve config directory: {}", e)))?;
    
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)?;
    }
    
    Ok(data_dir.join("config.json"))
}

fn load_config_sync(app_handle: &AppHandle) -> Result<AppConfig, AppError> {
    let config_path = get_config_path(app_handle)?;
    
    if !config_path.exists() {
        return Ok(AppConfig::default());
    }
    
    let content = fs::read_to_string(&config_path)?;
    let config: AppConfig = serde_json::from_str(&content)
        .map_err(|e| AppError::parse_error(format!("Failed to parse config: {}", e)))?;
    
    Ok(config)
}

fn default_data_dir(app_handle: &AppHandle) -> Result<PathBuf, AppError> {
    let document_dir = tauri::path::BaseDirectory::Document;
    let data_dir = app_handle
        .path()
        .resolve("PromptFlow", document_dir)
        .map_err(|e| AppError::io_error(format!("Failed to resolve data directory: {}", e)))?;

    Ok(data_dir)
}

fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(&path[2..]);
        }
    }
    PathBuf::from(path)
}

fn get_data_dir(app_handle: &AppHandle) -> Result<PathBuf, AppError> {
    let config = load_config_sync(app_handle)?;
    let storage_path = &config.storage.path;

    let trimmed = storage_path.trim();
    if trimmed.is_empty() {
        return Ok(default_data_dir(app_handle)?);
    }

    let mut path = if trimmed == "~" {
        dirs::home_dir().unwrap_or_else(|| PathBuf::from("~"))
    } else {
        expand_tilde(trimmed)
    };

    if path.components().next().is_none() {
        return Ok(default_data_dir(app_handle)?);
    }

    if !path.is_absolute() {
        return Err(AppError::validation_error(
            "storage.path must be an absolute path or empty (to use the default data directory)",
        ));
    }

    if path.exists() && !path.is_dir() {
        return Err(AppError::validation_error(
            "storage.path points to a file; it must be a directory",
        ));
    }

    // Normalize away any trailing separators.
    while path.as_os_str().to_string_lossy().ends_with(std::path::MAIN_SEPARATOR) {
        path.pop();
    }

    Ok(path)
}

#[tauri::command]
pub async fn init_repository(app_handle: AppHandle, path: String) -> Result<(), String> {
    let target_path = expand_tilde(&path);
    
    let config_path = target_path.join("config.json");
    let favorites_path = target_path.join("favorites");
    let templates_path = target_path.join("templates");
    
    // 创建目录结构（如果不存在）
    if !target_path.exists() {
        fs::create_dir_all(&target_path).map_err(|e| format!("无法创建目录: {}", e))?;
    }
    
    // 创建子目录（如果不存在）- create_dir_all 对已存在的目录不会报错
    fs::create_dir_all(&favorites_path).map_err(|e| format!("无法创建 favorites 目录: {}", e))?;
    fs::create_dir_all(&templates_path).map_err(|e| format!("无法创建 templates 目录: {}", e))?;

    install_starter_templates(&templates_path)?;
    
    // 只有当 config.json 不存在时才创建默认配置
    if !config_path.exists() {
        let mut config = AppConfig::default();
        config.storage.path = path.clone();
        
        let config_content = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("无法序列化配置: {}", e))?;
        fs::write(&config_path, config_content)
            .map_err(|e| format!("无法写入配置文件: {}", e))?;
    }
    
    // Also update the app's main config to point to this new location
    let app_config_path = get_config_path(&app_handle).map_err(|e| e.to_string())?;
    let mut app_config = load_config_sync(&app_handle).unwrap_or_default();
    app_config.storage.path = path;
    
    let app_config_content = serde_json::to_string_pretty(&app_config)
        .map_err(|e| format!("无法序列化应用配置: {}", e))?;
    fs::write(&app_config_path, app_config_content)
        .map_err(|e| format!("无法写入应用配置: {}", e))?;
    
    Ok(())
}

fn install_starter_templates(templates_path: &PathBuf) -> Result<(), String> {
    let now = generate_timestamp();

    let starter_items: Vec<(&str, &str, Option<&str>, Vec<&str>, &str)> = vec![
        (
            "starter-engineering-workflow",
            "Starter - 工程任务（Explore→Plan→Implement→Verify）",
            Some("按工程化流程推进编码任务：先探索与计划，再实现与验证。"),
            vec!["starter", "engineering", "workflow"],
            "你是我的高级软件工程师与结对编程伙伴。\n\n# 目标\n完成我描述的工程任务，并确保可运行、可验证。\n\n# 输入上下文（请先读取/确认）\n- 仓库/项目：[[项目类型/语言/框架]]\n- 相关文件/目录：[[文件路径列表]]（如果我没给，你先问我或让我提供）\n- 约束：[[不能改动的部分/兼容性/截止时间/风格要求]]\n\n# 工作流程（必须按顺序）\n1) Explore：先复述你理解的目标，并列出你需要确认的 3-8 个关键问题（如缺省就提问）。\n2) Plan：给出一个简短计划（3-6 步），并明确风险点与验证方式。\n3) Implement：按计划实现（分步骤说明你改了什么）。\n4) Verify：给出自检清单（编译/测试/边界情况），并逐项说明你如何验证。\n\n# 输出格式（必须严格遵守）\n- **理解**：...\n- **计划**：...\n- **实现**：...\n- **验证**：...\n- **后续建议**：...\n",
        ),
        (
            "starter-bug-debugging",
            "Starter - Bug 定位与修复（复现→假设→验证→修复）",
            Some("把模糊 bug 变成可复现、可验证的修复方案与回归清单。"),
            vec!["starter", "debugging", "bugfix"],
            "你是资深 Debug 工程师。你的目标是用最少的假设，快速定位根因并给出可验证修复方案。\n\n# Bug 描述\n[[现象/报错/截图文字]]\n\n# 环境信息\n- OS/浏览器/版本：[[...]]\n- 相关依赖版本：[[...]]\n- 日志/堆栈：[[粘贴日志；没有就说\"暂无\"；也可以提出需要哪些日志]]\n\n# 你必须产出\n1) 复现路径（最小复现步骤，按 1/2/3...）\n2) 根因假设列表（按概率排序，每条都给\"证据/线索/需要验证什么\"）\n3) 最优先的验证手段（我该先看哪些文件/加哪些日志/跑哪些命令）\n4) 修复方案（最小改动优先），并说明为什么能解决\n5) 回归测试清单（确保不引入新问题）\n\n# 输出格式（严格）\n- **复现步骤**：\n- **根因假设（按概率排序）**：\n- **验证计划**：\n- **修复方案**：\n- **回归测试**：\n",
        ),
        (
            "starter-prd-breakdown",
            "Starter - PRD 拆解（用户故事→任务→验收标准）",
            Some("把需求转成工程可执行的 Epic/Story/Task 与可测试验收标准。"),
            vec!["starter", "product", "planning"],
            "你是产品 + 技术负责人，擅长把模糊需求变成可执行的开发计划。\n\n# 需求描述（原始）\n[[把你想到的需求直接粘贴，越口语越可以]]\n\n# 约束\n- 目标用户：[[...]]\n- 不做什么（Out of scope）：[[...]]\n- 时间/资源：[[...]]\n- 依赖系统：[[...]]\n\n# 你需要输出\n1) 需求澄清问题（最多 6 个，优先问\"影响方案选择\"的）\n2) 核心用户故事（1-3 条）\n3) 功能拆解（Epic → Stories → Tasks）\n4) 每个 Story 的验收标准（可测试、可判定，避免\"更好/更快\"）\n5) 风险与备选方案（技术/产品/数据）\n\n# 输出格式\n- **澄清问题**：\n- **用户故事**：\n- **拆解（Epic/Story/Task）**：\n- **验收标准**：\n- **风险与备选**：\n",
        ),
        (
            "starter-gemini-official-template",
            "Starter - Gemini 官方 Prompt 模板（Identity/Constraints/Format）",
            Some("Google Gemini 官方推荐的结构化提示词模板骨架。"),
            vec!["starter", "official", "gemini", "structure"],
            "System Instruction:\n\n<role>\nYou are a specialized assistant for [[Domain/Role, e.g., Data Science / Senior Software Engineer]].\nYou are precise, analytical, and persistent.\n</role>\n\n<instructions>\n1. Plan: Analyze the task and create a step-by-step plan.\n2. Execute: Carry out the plan.\n3. Validate: Review your output against the user's task.\n4. Format: Present the final answer in the requested structure.\n</instructions>\n\n<constraints>\n- Verbosity: [[Low/Medium/High]]\n- Tone: [[Formal/Casual/Technical]]\n- Language: [[Chinese/English]]\n</constraints>\n\n<output_format>\nStructure your response as follows:\n1) Executive Summary: [[short overview]]\n2) Detailed Response: [[main content]]\n3) Validation Checklist: [[bullet checklist]]\n</output_format>\n\n\nUser Prompt:\n\n<context>\n[[Paste relevant docs / code snippets / background info here]]\n</context>\n\n<task>\n[[Insert specific request here]]\n</task>\n\n<final_instruction>\nThink step-by-step before answering, then provide the final response in the output_format.\n</final_instruction>\n",
        ),
        (
            "starter-claude-code-workflow",
            "Starter - Claude Code 官方工作流（Explore→Plan→Implement→Verify）",
            Some("Anthropic Claude Code 官方工作流：先探索与计划，复杂任务用 checklist 推进。"),
            vec!["starter", "official", "claude", "coding-workflow"],
            "You are an expert engineer working in my codebase.\n\n## Workflow (follow in order)\n1) Explore:\n   - Identify the relevant files/modules.\n   - If you are unsure, ask me for the missing context or request specific files.\n   - Do NOT write code yet.\n\n2) Plan:\n   - Propose a short plan (3-6 steps).\n   - List risks / edge cases.\n   - Wait for my confirmation before coding.\n\n3) Implement:\n   - Make the minimal correct changes.\n   - Explain what changed at a high level.\n\n4) Verify:\n   - Provide a verification checklist (tests to run, cases to check).\n   - If you cannot run tests, explain what I should run and what success looks like.\n\n## Checklist / Scratchpad (for complex tasks)\nCreate a checklist of sub-tasks and tick them off one by one.\n\n## Output rules\n- Be specific and concrete.\n- Prefer bullet points and clear sections.\n",
        ),
        (
            "starter-openai-gpt52-official-template",
            "Starter - OpenAI GPT-5.2 官方模板（输出形状/范围/歧义/工具/结构化）",
            Some("OpenAI Cookbook（GPT-5.2 Prompting Guide）提炼的官方提示词块，用于提升可靠性与可评估性。"),
            vec!["starter", "official", "openai", "gpt-5.2", "structure"],
            "# Role & Objective\nYou are [[role]]. Your objective is [[objective]].\n\n<output_verbosity_spec>\n- Default: 3–6 sentences or ≤5 bullets for typical answers.\n- For simple yes/no + short explanation questions: ≤2 sentences.\n- For complex multi-step or multi-file tasks:\n  - 1 short overview paragraph\n  - then ≤5 bullets tagged: What changed, Where, Risks, Next steps, Open questions.\n- Avoid long narrative paragraphs; prefer compact bullets and short sections.\n- Do not rephrase the user’s request unless it changes semantics.\n</output_verbosity_spec>\n\n<design_and_scope_constraints>\n- Implement EXACTLY and ONLY what the user requests.\n- No extra features, no added components, no UX embellishments.\n- Do NOT invent colors, shadows, tokens, animations, or new UI elements, unless requested or necessary.\n- If any instruction is ambiguous, choose the simplest valid interpretation.\n</design_and_scope_constraints>\n\n<long_context_handling>\n- For inputs longer than ~10k tokens:\n  - First, produce a short outline of key sections relevant to the request.\n  - Re-state constraints explicitly before answering.\n  - Anchor claims to sections; quote/paraphrase fine details (dates/thresholds/clauses).\n</long_context_handling>\n\n<uncertainty_and_ambiguity>\n- If ambiguous or underspecified:\n  - Ask up to 1–3 precise clarifying questions, OR\n  - Present 2–3 plausible interpretations with clearly labeled assumptions.\n- Never fabricate exact figures or references when uncertain.\n</uncertainty_and_ambiguity>\n\n<tool_usage_rules>\n- Prefer tools whenever you need fresh or user-specific data.\n- After any write/update tool call, restate: What changed, Where, Validation performed.\n</tool_usage_rules>\n\n<extraction_spec>\nUse this only when extracting structured data into JSON.\n- Follow the schema exactly (no extra fields): [[PASTE_JSON_SCHEMA]]\n- If a field is not present, set it to null rather than guessing.\n- Before returning, re-scan the source for missed fields.\n</extraction_spec>\n\n# User Task\n[[paste the task + context here]]\n",
        ),
    ];

    for (id, title, description, tags, content) in starter_items {
        let file_path = templates_path.join(format!("{}.md", id));
        if file_path.exists() {
            continue;
        }

        let prompt = PromptItem {
            id: id.to_string(),
            title: title.to_string(),
            content: content.to_string(),
            tags: tags.into_iter().map(|t| t.to_string()).collect(),
            description: description.map(|d| d.to_string()),
            use_count: 0,
            last_used: None,
            created_at: now.clone(),
            updated_at: now.clone(),
            file_path: file_path.to_string_lossy().to_string(),
            folder: "templates".to_string(),
        };

        let markdown = serialize_markdown_prompt(&prompt);
        fs::write(&file_path, markdown).map_err(|e| format!("Failed to write starter template: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn export_data_dir(app_handle: AppHandle, target_dir: String) -> Result<String, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let export_root = std::path::PathBuf::from(&target_dir);

    if !export_root.exists() {
        fs::create_dir_all(&export_root).map_err(|e| e.to_string())?;
    }

    // Create ZIP file with timestamp
    let timestamp = generate_timestamp().replace(':', "-").replace(' ', "_");
    let zip_filename = format!("PromptFlow-Export-{}.zip", timestamp);
    let zip_path = export_root.join(&zip_filename);

    let file = File::create(&zip_path).map_err(|e| format!("Failed to create ZIP file: {}", e))?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    // Walk through data directory and add files to ZIP
    for entry in WalkDir::new(&data_dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        let relative_path = path.strip_prefix(&data_dir).unwrap_or(path);
        let relative_str = relative_path.to_string_lossy();

        if path.is_file() {
            zip.start_file(relative_str.to_string(), options)
                .map_err(|e| format!("Failed to add file to ZIP: {}", e))?;
            
            let mut f = File::open(path).map_err(|e| format!("Failed to open file: {}", e))?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer).map_err(|e| format!("Failed to read file: {}", e))?;
            zip.write_all(&buffer).map_err(|e| format!("Failed to write to ZIP: {}", e))?;
        } else if path.is_dir() && path != data_dir.as_path() {
            // Add directory entry
            let dir_name = format!("{}/", relative_str);
            zip.add_directory(dir_name, options)
                .map_err(|e| format!("Failed to add directory to ZIP: {}", e))?;
        }
    }

    zip.finish().map_err(|e| format!("Failed to finalize ZIP: {}", e))?;

    Ok(zip_path.to_string_lossy().to_string())
}

fn ensure_directories(app_handle: &AppHandle) -> Result<PathBuf, AppError> {
    let data_dir = get_data_dir(app_handle)?;

    if data_dir.components().next().is_none() {
        return Err(AppError::validation_error("Resolved data directory is empty"));
    }

    if data_dir.exists() && !data_dir.is_dir() {
        return Err(AppError::validation_error(
            "Resolved data directory points to a file; it must be a directory",
        ));
    }

    let favorites_dir = data_dir.join("favorites");
    let templates_dir = data_dir.join("templates");
    
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)?;
    }
    if !favorites_dir.exists() {
        fs::create_dir_all(&favorites_dir)?;
    }
    if !templates_dir.exists() {
        fs::create_dir_all(&templates_dir)?;
    }
    
    Ok(data_dir)
}

#[tauri::command]
pub async fn get_data_directory(app_handle: AppHandle) -> Result<String, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    Ok(data_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn list_files(dir: String, extension: Option<String>) -> Result<Vec<FileInfo>, String> {
    let path = std::path::Path::new(&dir);
    if !path.exists() {
        return Ok(vec![]);
    }

    let mut files = vec![];
    let entries = fs::read_dir(path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        let file_path = entry.path();
        if file_path.is_file() {
            let file_name = file_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            if let Some(ref ext) = extension {
                if !file_name.ends_with(ext) {
                    continue;
                }
            }

            let metadata = entry.metadata().ok();
            let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            let modified_at = metadata
                .and_then(|m| m.modified().ok())
                .map(|t| {
                    t.duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_secs().to_string())
                        .unwrap_or_default()
                })
                .unwrap_or_default();

            files.push(FileInfo {
                name: file_name,
                path: file_path.to_string_lossy().to_string(),
                size,
                modified_at,
            });
        }
    }

    Ok(files)
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))
}

#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

#[tauri::command]
pub async fn get_all_prompts(app_handle: AppHandle) -> Result<Vec<PromptItem>, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let mut prompts = vec![];

    for folder in ["favorites", "templates"] {
        let folder_path = data_dir.join(folder);
        if folder_path.exists() {
            let entries = fs::read_dir(&folder_path).map_err(|e| e.to_string())?;
            for entry in entries.flatten() {
                let file_path = entry.path();
                if file_path.extension().map(|e| e == "md").unwrap_or(false) {
                    if let Ok(content) = fs::read_to_string(&file_path) {
                        let path_str = file_path.to_string_lossy().to_string();
                        if let Ok(prompt) = parse_markdown_prompt(&content, &path_str, folder) {
                            prompts.push(prompt);
                        }
                    }
                }
            }
        }
    }

    Ok(prompts)
}

#[tauri::command]
pub async fn get_favorites(app_handle: AppHandle) -> Result<Vec<PromptItem>, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let folder_path = data_dir.join("favorites");
    let mut prompts = vec![];

    if folder_path.exists() {
        let entries = fs::read_dir(&folder_path).map_err(|e| e.to_string())?;
        for entry in entries.flatten() {
            let file_path = entry.path();
            if file_path.extension().map(|e| e == "md").unwrap_or(false) {
                if let Ok(content) = fs::read_to_string(&file_path) {
                    let path_str = file_path.to_string_lossy().to_string();
                    if let Ok(prompt) = parse_markdown_prompt(&content, &path_str, "favorites") {
                        prompts.push(prompt);
                    }
                }
            }
        }
    }

    Ok(prompts)
}

#[tauri::command]
pub async fn get_templates(app_handle: AppHandle) -> Result<Vec<PromptItem>, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let folder_path = data_dir.join("templates");
    let mut prompts = vec![];

    if folder_path.exists() {
        let entries = fs::read_dir(&folder_path).map_err(|e| e.to_string())?;
        for entry in entries.flatten() {
            let file_path = entry.path();
            if file_path.extension().map(|e| e == "md").unwrap_or(false) {
                if let Ok(content) = fs::read_to_string(&file_path) {
                    let path_str = file_path.to_string_lossy().to_string();
                    if let Ok(prompt) = parse_markdown_prompt(&content, &path_str, "templates") {
                        prompts.push(prompt);
                    }
                }
            }
        }
    }

    Ok(prompts)
}

#[tauri::command]
pub async fn create_prompt(app_handle: AppHandle, input: CreatePromptInput) -> Result<PromptItem, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    
    let folder = if input.folder == "templates" { "templates" } else { "favorites" };
    let folder_path = data_dir.join(folder);
    
    let file_name = sanitize_filename(&input.title);
    let file_path = folder_path.join(format!("{}.md", file_name));
    
    let now = generate_timestamp();
    let prompt = PromptItem {
        id: file_name.clone(),
        title: input.title,
        content: input.content,
        tags: input.tags,
        description: input.description,
        use_count: 0,
        last_used: None,
        created_at: now.clone(),
        updated_at: now,
        file_path: file_path.to_string_lossy().to_string(),
        folder: folder.to_string(),
    };
    
    let markdown = serialize_markdown_prompt(&prompt);
    fs::write(&file_path, markdown).map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(prompt)
}

#[tauri::command]
pub async fn update_prompt(
    app_handle: AppHandle,
    id: String,
    folder: String,
    updates: UpdatePromptInput,
) -> Result<PromptItem, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let folder_path = data_dir.join(&folder);
    let file_path = folder_path.join(format!("{}.md", id));
    
    if !file_path.exists() {
        return Err(format!("Prompt not found: {}", id));
    }
    
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let path_str = file_path.to_string_lossy().to_string();
    let mut prompt = parse_markdown_prompt(&content, &path_str, &folder).map_err(|e| e.to_string())?;
    
    if let Some(title) = updates.title {
        prompt.title = title;
    }
    if let Some(content) = updates.content {
        prompt.content = content;
    }
    if let Some(tags) = updates.tags {
        prompt.tags = tags;
    }
    if let Some(description) = updates.description {
        prompt.description = Some(description);
    }
    
    prompt.updated_at = generate_timestamp();
    
    let markdown = serialize_markdown_prompt(&prompt);
    fs::write(&file_path, markdown).map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(prompt)
}

#[tauri::command]
pub async fn delete_prompt(app_handle: AppHandle, id: String, folder: String) -> Result<(), String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let folder_path = data_dir.join(&folder);
    let file_path = folder_path.join(format!("{}.md", id));
    
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn increment_use_count(app_handle: AppHandle, id: String, folder: String) -> Result<PromptItem, String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let folder_path = data_dir.join(&folder);
    let file_path = folder_path.join(format!("{}.md", id));
    
    if !file_path.exists() {
        return Err(format!("Prompt not found: {}", id));
    }
    
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let path_str = file_path.to_string_lossy().to_string();
    let mut prompt = parse_markdown_prompt(&content, &path_str, &folder).map_err(|e| e.to_string())?;
    
    prompt.use_count += 1;
    prompt.last_used = Some(generate_timestamp());
    prompt.updated_at = generate_timestamp();
    
    let markdown = serialize_markdown_prompt(&prompt);
    fs::write(&file_path, markdown).map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(prompt)
}

#[tauri::command]
pub async fn init_templates(app_handle: AppHandle) -> Result<(), String> {
    let data_dir = ensure_directories(&app_handle).map_err(|e| e.to_string())?;
    let templates_path = data_dir.join("templates");

    if !templates_path.exists() {
        fs::create_dir_all(&templates_path).map_err(|e| format!("Failed to create templates directory: {}", e))?;
    }

    let template_files = [
        ("template1.md", "Template 1", "This is a template"),
        ("template2.md", "Template 2", "This is another template"),
        ("template3.md", "Template 3", "This is yet another template"),
        ("template4.md", "Template 4", "This is a fourth template"),
        ("template5.md", "Template 5", "This is a fifth template"),
    ];

    for (file_name, title, content) in template_files {
        let file_path = templates_path.join(file_name);

        if !file_path.exists() {
            let prompt = PromptItem {
                id: sanitize_filename(title),
                title: title.to_string(),
                content: content.to_string(),
                tags: vec![],
                description: None,
                use_count: 0,
                last_used: None,
                created_at: generate_timestamp(),
                updated_at: generate_timestamp(),
                file_path: file_path.to_string_lossy().to_string(),
                folder: "templates".to_string(),
            };

            let markdown = serialize_markdown_prompt(&prompt);
            fs::write(&file_path, markdown).map_err(|e| format!("Failed to write template file: {}", e))?;
        }
    }

    Ok(())
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c.to_ascii_lowercase()
            } else if c.is_whitespace() {
                '-'
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim_matches(|c| c == '-' || c == '_')
        .to_string()
}
