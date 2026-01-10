use crate::models::{PromptFrontmatter, PromptItem};
use crate::utils::AppError;

const FRONTMATTER_DELIMITER: &str = "---";

pub fn parse_markdown_prompt(content: &str, file_path: &str, folder: &str) -> Result<PromptItem, AppError> {
    let path = std::path::Path::new(file_path);
    let id = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_string();

    let file_name_title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("未命名")
        .to_string();

    let parts: Vec<&str> = content.splitn(3, FRONTMATTER_DELIMITER).collect();

    // 兼容：如果没有 frontmatter，则把整篇内容视为正文，标题使用文件名
    if parts.len() < 3 {
        let body = content.trim();
        return Ok(PromptItem {
            id,
            title: file_name_title,
            content: body.to_string(),
            tags: vec![],
            description: None,
            use_count: 0,
            last_used: None,
            created_at: chrono_now(),
            updated_at: chrono_now(),
            file_path: file_path.to_string(),
            folder: folder.to_string(),
        });
    }

    let frontmatter_str = parts[1].trim();
    let body = parts[2].trim();

    let frontmatter: PromptFrontmatter = serde_yaml_parse(frontmatter_str)?;

    Ok(PromptItem {
        id,
        title: if frontmatter.title.trim().is_empty() {
            file_name_title
        } else {
            frontmatter.title
        },
        content: body.to_string(),
        tags: frontmatter.tags,
        description: frontmatter.description,
        use_count: frontmatter.use_count,
        last_used: frontmatter.last_used,
        created_at: frontmatter.created_at,
        updated_at: frontmatter.updated_at,
        file_path: file_path.to_string(),
        folder: folder.to_string(),
    })
}

pub fn serialize_markdown_prompt(item: &PromptItem) -> String {
    let frontmatter = PromptFrontmatter {
        title: item.title.clone(),
        tags: item.tags.clone(),
        description: item.description.clone(),
        use_count: item.use_count,
        last_used: item.last_used.clone(),
        created_at: item.created_at.clone(),
        updated_at: item.updated_at.clone(),
    };

    let yaml = serde_yaml_serialize(&frontmatter);
    
    format!("---\n{}\n---\n\n{}", yaml, item.content)
}

fn serde_yaml_parse(yaml_str: &str) -> Result<PromptFrontmatter, AppError> {
    let mut title = String::new();
    let mut tags: Vec<String> = vec![];
    let mut description: Option<String> = None;
    let mut use_count: u32 = 0;
    let mut last_used: Option<String> = None;
    let mut created_at = chrono_now();
    let mut updated_at = chrono_now();

    for line in yaml_str.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some((key, value)) = line.split_once(':') {
            let key = key.trim();
            let value = value.trim();

            match key {
                "title" => title = value.trim_matches('"').to_string(),
                "description" => description = Some(value.trim_matches('"').to_string()),
                "use_count" => use_count = value.parse().unwrap_or(0),
                "last_used" => last_used = Some(value.to_string()),
                "created_at" => created_at = value.to_string(),
                "updated_at" => updated_at = value.to_string(),
                "tags" => {
                    if value.starts_with('[') && value.ends_with(']') {
                        let inner = &value[1..value.len()-1];
                        tags = inner
                            .split(',')
                            .map(|s| s.trim().trim_matches('"').trim_matches('\'').to_string())
                            .filter(|s| !s.is_empty())
                            .collect();
                    }
                }
                _ => {}
            }
        }
    }

    Ok(PromptFrontmatter {
        title,
        tags,
        description,
        use_count,
        last_used,
        created_at,
        updated_at,
    })
}

fn serde_yaml_serialize(frontmatter: &PromptFrontmatter) -> String {
    let mut lines = vec![];
    
    lines.push(format!("title: \"{}\"", frontmatter.title));
    
    if !frontmatter.tags.is_empty() {
        let tags_str = frontmatter.tags
            .iter()
            .map(|t| format!("\"{}\"", t))
            .collect::<Vec<_>>()
            .join(", ");
        lines.push(format!("tags: [{}]", tags_str));
    } else {
        lines.push("tags: []".to_string());
    }
    
    if let Some(ref desc) = frontmatter.description {
        lines.push(format!("description: \"{}\"", desc));
    }
    
    lines.push(format!("use_count: {}", frontmatter.use_count));
    
    if let Some(ref last) = frontmatter.last_used {
        lines.push(format!("last_used: {}", last));
    }
    
    lines.push(format!("created_at: {}", frontmatter.created_at));
    lines.push(format!("updated_at: {}", frontmatter.updated_at));
    
    lines.join("\n")
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    format!("{}Z", secs)
}

pub fn generate_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    
    let secs = duration.as_secs();
    let days_since_epoch = secs / 86400;
    let years = 1970 + (days_since_epoch / 365);
    let remaining_days = days_since_epoch % 365;
    let month = (remaining_days / 30) + 1;
    let day = (remaining_days % 30) + 1;
    let hours = (secs % 86400) / 3600;
    let minutes = (secs % 3600) / 60;
    let seconds = secs % 60;
    
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", 
            years, month.min(12), day.min(31), hours, minutes, seconds)
}
