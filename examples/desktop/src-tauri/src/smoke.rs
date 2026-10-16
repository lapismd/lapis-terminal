use std::sync::atomic::{AtomicBool, Ordering};
use tauri_plugin_lapis_terminal::TerminalExt;
pub static CANCEL_NEXT: AtomicBool = AtomicBool::new(false);
pub static CANCELLED: AtomicBool = AtomicBool::new(false);
#[tauri::command]
pub fn smoke_cancelled() -> bool {
    CANCELLED.load(Ordering::Acquire)
}
#[tauri::command]
pub fn smoke_control(
    app: tauri::AppHandle,
    action: &str,
    report: serde_json::Value,
) -> Result<(), String> {
    match action {
        "progress" => println!("LAPIS_TERMINAL_PROGRESS={report}"),
        "cancel-exit" => {
            CANCEL_NEXT.store(true, Ordering::Release);
            app.exit(0);
        }
        "disable" => app.terminal().disable().map_err(|e| e.message)?,
        "enable" => app.terminal().enable().map_err(|e| e.message)?,
        "report" => {
            println!("LAPIS_TERMINAL_SMOKE={report}");
            app.exit(if report["ok"] == true { 0 } else { 1 });
        }
        _ => return Err("Unknown smoke operation".into()),
    }
    Ok(())
}
