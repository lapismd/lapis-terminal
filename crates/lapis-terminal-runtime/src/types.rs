use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// Public metadata. Launch paths and environment are never accepted over IPC.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Target {
    pub id: String,
    pub label: String,
}

/// Trusted Rust-only launch configuration, supplied by the embedding host.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LaunchSpec {
    pub target: Target,
    pub cwd: std::path::PathBuf,
    pub shell: String,
    pub args: Vec<String>,
    pub env: BTreeMap<String, String>,
}
impl LaunchSpec {
    pub fn new(target: Target, cwd: impl Into<std::path::PathBuf>) -> Self {
        Self {
            target,
            cwd: cwd.into(),
            shell: crate::shell::resolve_shell(std::env::var("SHELL").ok().as_deref()),
            args: vec!["-l".into()],
            env: BTreeMap::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct Config {
    pub application: String,
    pub max_sessions: usize,
    pub request_history: usize,
    pub scrollback: usize,
}
impl Default for Config {
    fn default() -> Self {
        Self {
            application: "lapis-terminal".into(),
            max_sessions: 20,
            request_history: 4096,
            scrollback: 5000,
        }
    }
}
impl Config {
    pub(crate) fn validate(&self) -> crate::Result<()> {
        if self.application.is_empty()
            || self.application.len() > 128
            || !(1..=128).contains(&self.max_sessions)
            || !(1..=65536).contains(&self.request_history)
            || self.scrollback > 100_000
        {
            return Err("Invalid terminal resource configuration".into());
        }
        Ok(())
    }
}
