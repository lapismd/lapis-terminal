use serde::Serialize;
#[derive(Debug, Serialize)]
pub struct Error {
    pub code: &'static str,
    pub message: String,
}
impl Error {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}
impl From<String> for Error {
    fn from(message: String) -> Self {
        Self::new("runtime", message)
    }
}
pub type Result<T> = std::result::Result<T, Error>;
