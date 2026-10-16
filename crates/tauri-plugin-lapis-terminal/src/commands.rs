//! Narrow native commands: no arbitrary program, path, environment or HTTP proxy.
use crate::{Error, HostContext, Result, TerminalHost};
use lapis_terminal_runtime::{
    SessionInfo, Target,
    wire::{AttachResponse, TerminalMessage, WireViewport},
};
use std::sync::Arc;
use tauri::{State, WebviewWindow, ipc::Channel};
fn context<R: tauri::Runtime>(window: &WebviewWindow<R>) -> Result<HostContext> {
    Ok(HostContext {
        window: window.label().into(),
        url: window
            .url()
            .map_err(|e| Error::new("denied", e.to_string()))?
            .to_string(),
    })
}
async fn blocking<T: Send + 'static>(f: impl FnOnce() -> Result<T> + Send + 'static) -> Result<T> {
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|_| Error::new("runtime", "Terminal task failed"))?
}
#[tauri::command]
pub async fn targets<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
) -> Result<Vec<Target>> {
    let context = context(&window)?;
    let host = state.inner().clone();
    blocking(move || host.targets(&context)).await
}
#[tauri::command]
pub fn list<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
) -> Result<Vec<SessionInfo>> {
    let runtime = state.runtime(&context(&window)?)?;
    runtime.list().map_err(Into::into)
}
#[tauri::command]
pub async fn open<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    request_id: String,
    target_id: String,
    columns: u16,
    rows: u16,
) -> Result<SessionInfo> {
    let context = context(&window)?;
    let host = state.inner().clone();
    blocking(move || host.open(&context, &request_id, &target_id, columns, rows)).await
}
#[tauri::command]
pub async fn attach<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    on_frame: Channel<TerminalMessage>,
) -> Result<AttachResponse> {
    let runtime = state.runtime(&context(&window)?)?;
    blocking(move || {
        runtime
            .attach(
                &session_id,
                Arc::new(move |message| on_frame.send(message).map_err(|e| e.to_string())),
            )
            .map_err(Into::into)
    })
    .await
}
#[tauri::command]
pub async fn close<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
) -> Result<()> {
    let runtime = state.runtime(&context(&window)?)?;
    blocking(move || runtime.close(&session_id).map_err(Into::into)).await
}
#[tauri::command]
pub fn input<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    data: String,
) -> Result<()> {
    let runtime = state.runtime(&context(&window)?)?;
    runtime.input(&session_id, &data).map_err(Into::into)
}
#[tauri::command]
pub async fn resize<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    columns: u16,
    rows: u16,
) -> Result<WireViewport> {
    let runtime = state.runtime(&context(&window)?)?;
    blocking(move || {
        runtime
            .resize(&session_id, columns, rows)
            .map_err(Into::into)
    })
    .await
}
#[tauri::command]
pub fn scroll<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    lines: i32,
) -> Result<()> {
    let runtime = state.runtime(&context(&window)?)?;
    runtime.scroll(&session_id, lines).map_err(Into::into)
}
#[tauri::command]
pub fn focus<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    focused: bool,
) -> Result<()> {
    let runtime = state.runtime(&context(&window)?)?;
    runtime.focus(&session_id, focused).map_err(Into::into)
}
#[tauri::command]
pub fn ack<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    subscription_id: String,
    sequence: u64,
) -> Result<()> {
    let runtime = state.runtime(&context(&window)?)?;
    runtime
        .acknowledge(&session_id, &subscription_id, sequence)
        .map_err(Into::into)
}
#[tauri::command]
pub fn viewport_ready<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    subscription_id: String,
    viewport: WireViewport,
) -> Result<()> {
    let runtime = state.runtime(&context(&window)?)?;
    runtime
        .viewport_ready(&session_id, &subscription_id, viewport)
        .map_err(Into::into)
}
#[tauri::command]
pub fn detach<R: tauri::Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, Arc<TerminalHost>>,
    session_id: String,
    subscription_id: String,
) -> Result<()> {
    let runtime = state.runtime(&context(&window)?)?;
    runtime
        .detach(&session_id, &subscription_id)
        .map_err(Into::into)
}
