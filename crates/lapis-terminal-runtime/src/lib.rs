//! Native terminal ownership. Each runtime is an explicit, isolated instance.
#![cfg(unix)]
pub mod env_fence;
#[cfg(test)]
mod env_fence_tests;
mod io;
pub mod lifecycle;
#[cfg(test)]
mod lifecycle_tests;
pub mod path;
pub mod process_tree;
pub mod pty_io;
mod runtime;
mod session;
pub mod shell;
mod transport;
mod types;
pub mod wire;
pub use runtime::Runtime;
pub use session::SessionInfo;
pub use types::{Config, LaunchSpec, Target};
pub type Result<T> = std::result::Result<T, String>;
pub type Sink = std::sync::Arc<dyn Fn(wire::TerminalMessage) -> Result<()> + Send + Sync>;
