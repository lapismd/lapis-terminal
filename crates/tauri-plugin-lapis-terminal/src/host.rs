use crate::{Error, Result};
use lapis_terminal_runtime::{Config, LaunchSpec, Runtime, Target};
use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
};

/// Created from Tauri's invoking window; never deserialized from a JS argument.
#[derive(Debug, Clone)]
pub struct HostContext {
    pub window: String,
    pub url: String,
}
/// Application trust decisions. All methods run in Rust, before session access.
pub trait HostPolicy: Send + Sync + 'static {
    fn authorize(&self, context: &HostContext) -> std::result::Result<(), String>;
    fn targets(&self, context: &HostContext) -> std::result::Result<Vec<Target>, String>;
    fn resolve(
        &self,
        context: &HostContext,
        target_id: &str,
    ) -> std::result::Result<LaunchSpec, String>;
}
struct Registry {
    windows: BTreeMap<String, Arc<Runtime>>,
    enabled: bool,
    stopped: bool,
}
pub struct TerminalHost {
    policy: Arc<dyn HostPolicy>,
    config: Config,
    state: Mutex<Registry>,
}
impl TerminalHost {
    pub fn new(policy: Arc<dyn HostPolicy>, config: Config) -> Result<Self> {
        // Validate configuration before any native session is possible.
        Runtime::new(config.clone()).map_err(Error::from)?;
        Ok(Self {
            policy,
            config,
            state: Mutex::new(Registry {
                windows: BTreeMap::new(),
                enabled: true,
                stopped: false,
            }),
        })
    }
    pub fn runtime(&self, context: &HostContext) -> Result<Arc<Runtime>> {
        self.policy
            .authorize(context)
            .map_err(|e| Error::new("denied", e))?;
        let mut state = self
            .state
            .lock()
            .map_err(|_| Error::new("unavailable", "Terminal host unavailable"))?;
        if !state.enabled || state.stopped {
            return Err(Error::new("disabled", "Terminal service is disabled"));
        }
        if let Some(runtime) = state.windows.get(&context.window) {
            return Ok(runtime.clone());
        }
        if state.windows.len() >= 32 {
            return Err(Error::new("unavailable", "Terminal window limit reached"));
        }
        let runtime = Arc::new(Runtime::new(self.config.clone())?);
        state
            .windows
            .insert(context.window.clone(), runtime.clone());
        Ok(runtime)
    }
    pub fn targets(&self, context: &HostContext) -> Result<Vec<Target>> {
        self.runtime(context)?;
        self.policy
            .targets(context)
            .map_err(|e| Error::new("denied", e))
    }
    pub fn open(
        &self,
        context: &HostContext,
        request: &str,
        target: &str,
        columns: u16,
        rows: u16,
    ) -> Result<lapis_terminal_runtime::SessionInfo> {
        let runtime = self.runtime(context)?;
        let spec = self
            .policy
            .resolve(context, target)
            .map_err(|e| Error::new("denied", e))?;
        if spec.target.id != target {
            return Err(Error::new(
                "denied",
                "Target resolver returned a different identity",
            ));
        }
        runtime
            .open(request, spec, columns, rows)
            .map_err(Into::into)
    }
    pub fn enable(&self) -> Result<()> {
        let mut state = self
            .state
            .lock()
            .map_err(|_| Error::new("unavailable", "Terminal host unavailable"))?;
        if state.stopped {
            return Err(Error::new("disabled", "Terminal host has shut down"));
        }
        for runtime in state.windows.values() {
            runtime.enable()?;
        }
        state.enabled = true;
        Ok(())
    }
    pub fn disable(&self) -> Result<()> {
        self.stop(false)
    }
    pub fn shutdown(&self) -> Result<()> {
        self.stop(true)
    }
    fn stop(&self, permanent: bool) -> Result<()> {
        let mut state = self
            .state
            .lock()
            .map_err(|_| Error::new("unavailable", "Terminal host unavailable"))?;
        state.enabled = false;
        state.stopped |= permanent;
        let errors: Vec<_> = state
            .windows
            .values()
            .filter_map(|runtime| {
                if permanent {
                    runtime.shutdown().err()
                } else {
                    runtime.disable().err()
                }
            })
            .collect();
        if errors.is_empty() {
            Ok(())
        } else {
            Err(Error::from(errors.join("; ")))
        }
    }
    pub fn close_window(&self, label: &str) -> Result<()> {
        let mut state = self
            .state
            .lock()
            .map_err(|_| Error::new("unavailable", "Terminal host unavailable"))?;
        if let Some(runtime) = state.windows.remove(label) {
            runtime.shutdown()?;
        }
        Ok(())
    }
}
impl Drop for TerminalHost {
    fn drop(&mut self) {
        let _ = self.shutdown();
    }
}
