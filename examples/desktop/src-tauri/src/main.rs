use tauri::{WebviewUrl, WebviewWindowBuilder};
#[cfg(feature = "native-smoke")]
mod smoke;
use tauri_plugin_lapis_terminal::{
    Builder, HostContext, HostPolicy,
    runtime::{LaunchSpec, Target},
};
struct DemoPolicy(tempfile::TempDir);
impl HostPolicy for DemoPolicy {
    fn authorize(&self, context: &HostContext) -> Result<(), String> {
        let url: tauri::Url = context.url.parse().map_err(|_| "Invalid URL")?;
        let packaged = url.scheme() == "tauri" && url.host_str() == Some("localhost");
        let development = cfg!(debug_assertions)
            && url.scheme() == "http"
            && url.host_str() == Some("127.0.0.1")
            && url.port() == Some(6049);
        if context.window == "main" && (packaged || development) {
            Ok(())
        } else {
            Err("Window is not admitted".into())
        }
    }
    fn targets(&self, _: &HostContext) -> Result<Vec<Target>, String> {
        Ok(vec![Target {
            id: "demo".into(),
            label: "Temporary demo workspace".into(),
        }])
    }
    fn resolve(&self, _: &HostContext, id: &str) -> Result<LaunchSpec, String> {
        if id != "demo" {
            return Err("Unknown target".into());
        }
        let cwd = self.0.path().canonicalize().map_err(|e| e.to_string())?;
        let mut spec = LaunchSpec::new(
            Target {
                id: id.into(),
                label: "Temporary demo workspace".into(),
            },
            cwd,
        );
        // The demo is isolated from user startup files; hosts choose their own shell.
        spec.shell = "/bin/sh".into();
        spec.args.clear();
        spec.env
            .insert("HOME".into(), self.0.path().display().to_string());
        Ok(spec)
    }
}
fn main() {
    let policy = DemoPolicy(tempfile::tempdir().expect("temporary demo directory"));
    let builder = tauri::Builder::default().plugin(Builder::new(policy).build());
    #[cfg(feature = "native-smoke")]
    let builder = builder.invoke_handler(tauri::generate_handler![
        smoke::smoke_control,
        smoke::smoke_cancelled
    ]);
    builder
        .setup(|app| {
            let window =
                WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                    .title("Lapis Terminal — native demo")
                    .inner_size(1100.0, 850.0);
            #[cfg(feature = "native-smoke")]
            let window = window.initialization_script("window.__LAPIS_TERMINAL_SMOKE__ = true;");
            window.build()?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("build terminal demo")
        .run(|_app, _event| {
            #[cfg(feature = "native-smoke")]
            if let tauri::RunEvent::ExitRequested { api, .. } = _event {
                use std::sync::atomic::Ordering;
                if smoke::CANCEL_NEXT.swap(false, Ordering::AcqRel) {
                    api.prevent_exit();
                    smoke::CANCELLED.store(true, Ordering::Release);
                }
            }
        });
}
