use super::{
    Config, LaunchSpec, Result, SessionInfo, Sink,
    session::Session,
    wire::{AttachResponse, WireViewport},
};
use std::{
    collections::{BTreeMap, BTreeSet},
    sync::{Arc, Mutex},
};
use uuid::Uuid;

pub struct Runtime(Mutex<Registry>, Config);
#[derive(Default)]
struct Registry {
    sessions: BTreeMap<Uuid, Arc<Session>>,
    closed: BTreeSet<Uuid>,
    stopping: bool,
    disabled: bool,
}
impl Default for Runtime {
    fn default() -> Self {
        Self::new(Config::default()).expect("valid defaults")
    }
}
impl Runtime {
    pub fn new(config: Config) -> Result<Self> {
        config.validate()?;
        Ok(Self(Mutex::new(Registry::default()), config))
    }
    pub fn enable(&self) -> Result<()> {
        let mut state = self.0.lock().map_err(|_| "Terminal runtime unavailable")?;
        if state.stopping {
            return Err("Terminal runtime has shut down".into());
        }
        state.disabled = false;
        Ok(())
    }
    pub fn disable(&self) -> Result<()> {
        self.stop(false)
    }

    fn get(&self, id: &str) -> Result<Arc<Session>> {
        let id = Uuid::parse_str(id).map_err(|_| "Invalid terminal session")?;
        self.0
            .lock()
            .map_err(|_| "Terminal runtime unavailable")?
            .sessions
            .get(&id)
            .cloned()
            .ok_or_else(|| "Terminal session has ended".into())
    }
    pub fn list(&self) -> Result<Vec<SessionInfo>> {
        self.0
            .lock()
            .map_err(|_| "Terminal runtime unavailable")?
            .sessions
            .values()
            .map(|v| v.info())
            .collect()
    }
    pub fn open(
        &self,
        request: &str,
        target: LaunchSpec,
        columns: u16,
        rows: u16,
    ) -> Result<SessionInfo> {
        let id = Uuid::parse_str(request).map_err(|_| "Invalid terminal open identity")?;
        let mut sessions = self.0.lock().map_err(|_| "Terminal runtime unavailable")?;
        if sessions.stopping || sessions.disabled {
            return Err("Terminal runtime is stopping".into());
        }
        if let Some(session) = sessions.sessions.get(&id) {
            if session.target != target {
                return Err("Terminal open identity already used".into());
            }
            return session.info();
        }
        if sessions.closed.contains(&id) {
            return Err("This terminal session was closed".into());
        }
        if sessions.closed.len() >= self.1.request_history {
            return Err("Terminal request history is full; restart the app".into());
        }
        if sessions.sessions.len() >= self.1.max_sessions {
            return Err("Terminal session limit reached".into());
        }
        let session = Arc::new(Session::spawn(id, target, columns, rows, &self.1)?);
        let info = session.info()?;
        sessions.sessions.insert(id, session);
        Ok(info)
    }
    pub fn attach(&self, id: &str, sink: Sink) -> Result<AttachResponse> {
        self.get(id)?.attach(sink)
    }
    pub fn detach(&self, id: &str, subscription: &str) -> Result<()> {
        self.get(id)?.detach(subscription)
    }
    pub fn input(&self, id: &str, data: &str) -> Result<()> {
        self.get(id)?.input(data)
    }
    pub fn resize(&self, id: &str, columns: u16, rows: u16) -> Result<WireViewport> {
        self.get(id)?.resize(columns, rows)
    }
    pub fn scroll(&self, id: &str, lines: i32) -> Result<()> {
        self.get(id)?.scroll(lines)
    }
    pub fn focus(&self, id: &str, focused: bool) -> Result<()> {
        self.get(id)?.focus(focused)
    }
    pub fn acknowledge(&self, id: &str, subscription: &str, sequence: u64) -> Result<()> {
        self.get(id)?.acknowledge(subscription, sequence)
    }
    pub fn viewport_ready(
        &self,
        id: &str,
        subscription: &str,
        viewport: WireViewport,
    ) -> Result<()> {
        self.get(id)?.viewport_ready(subscription, viewport)
    }
    pub fn close(&self, id: &str) -> Result<()> {
        let key = Uuid::parse_str(id).map_err(|_| "Invalid terminal session")?;
        let session = {
            let mut state = self.0.lock().map_err(|_| "Terminal runtime unavailable")?;
            let session = state.sessions.remove(&key);
            if session.is_some() {
                state.closed.insert(key);
            }
            session
        };
        if let Some(session) = session {
            session.shutdown()?;
        }
        Ok(())
    }
    pub fn shutdown(&self) -> Result<()> {
        self.stop(true)
    }
    fn stop(&self, permanent: bool) -> Result<()> {
        // Hold the registry through cleanup so enable/open cannot overtake it.
        let mut state = self.0.lock().map_err(|_| "Terminal runtime unavailable")?;
        state.stopping |= permanent;
        state.disabled = true;
        let sessions = std::mem::take(&mut state.sessions);
        let mut errors = Vec::new();
        for (id, session) in sessions {
            state.closed.insert(id);
            if let Err(e) = session.shutdown() {
                errors.push(e);
            }
        }
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors.join("; "))
        }
    }
}
impl Drop for Runtime {
    fn drop(&mut self) {
        let _ = self.shutdown();
    }
}
