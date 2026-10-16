//! Optional Tauri integration; application trust remains in HostPolicy.
#![cfg(unix)]
mod commands;
mod error;
mod host;
pub use error::{Error, Result};
pub use host::{HostContext, HostPolicy, TerminalHost};
pub use lapis_terminal_runtime as runtime;
use std::sync::Arc;
use tauri::{Manager, RunEvent, Runtime, WindowEvent, plugin::TauriPlugin};

pub struct Builder {
    policy: Arc<dyn HostPolicy>,
    config: runtime::Config,
}
impl Builder {
    pub fn new(policy: impl HostPolicy) -> Self {
        Self {
            policy: Arc::new(policy),
            config: runtime::Config::default(),
        }
    }
    pub fn config(mut self, config: runtime::Config) -> Self {
        self.config = config;
        self
    }
    pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
        tauri::plugin::Builder::new("lapis-terminal")
            .invoke_handler(tauri::generate_handler![
                commands::targets,
                commands::list,
                commands::open,
                commands::attach,
                commands::detach,
                commands::input,
                commands::resize,
                commands::scroll,
                commands::focus,
                commands::ack,
                commands::viewport_ready,
                commands::close
            ])
            .setup(move |app, _| {
                let host = TerminalHost::new(self.policy, self.config)
                    .map_err(|e| std::io::Error::other(e.message))?;
                if !app.manage(Arc::new(host)) {
                    return Err("Terminal plugin already registered".into());
                }
                Ok(())
            })
            .on_event(|app, event| {
                if let Some(host) = app.try_state::<Arc<TerminalHost>>() {
                    match event {
                        RunEvent::Exit => {
                            let _ = host.shutdown();
                        }
                        RunEvent::WindowEvent {
                            label,
                            event: WindowEvent::Destroyed,
                            ..
                        } => {
                            let _ = host.close_window(label);
                        }
                        // CloseRequested / ExitRequested may be cancelled by the application.
                        _ => {}
                    }
                }
            })
            .on_drop(|app| {
                if let Some(host) = app.try_state::<Arc<TerminalHost>>() {
                    let _ = host.shutdown();
                }
            })
            .build()
    }
}
/// Rust-side controls; enable/disable are deliberately absent from WebView IPC.
pub trait TerminalExt<R: Runtime>: Manager<R> {
    fn terminal(&self) -> Arc<TerminalHost> {
        self.state::<Arc<TerminalHost>>().inner().clone()
    }
}
impl<R: Runtime, M: Manager<R>> TerminalExt<R> for M {}
