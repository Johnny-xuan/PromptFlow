use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AppError {
    pub message: String,
    pub code: String,
}

#[allow(dead_code)]
impl AppError {
    pub fn new(message: impl Into<String>, code: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: code.into(),
        }
    }

    pub fn io_error(message: impl Into<String>) -> Self {
        Self::new(message, "IO_ERROR")
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(message, "NOT_FOUND")
    }

    pub fn parse_error(message: impl Into<String>) -> Self {
        Self::new(message, "PARSE_ERROR")
    }

    pub fn validation_error(message: impl Into<String>) -> Self {
        Self::new(message, "VALIDATION_ERROR")
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        Self::io_error(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        Self::parse_error(err.to_string())
    }
}
