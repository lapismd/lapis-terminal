use std::sync::Arc;
use tauri_plugin_lapis_terminal::{
    HostContext, HostPolicy, TerminalHost,
    runtime::{Config, LaunchSpec, Target},
};
struct Policy(std::path::PathBuf);
impl HostPolicy for Policy {
    fn authorize(&self, context: &HostContext) -> Result<(), String> {
        if ["one", "two"].contains(&context.window.as_str()) && context.url == "tauri://localhost/"
        {
            Ok(())
        } else {
            Err("Untrusted window or origin".into())
        }
    }
    fn targets(&self, _: &HostContext) -> Result<Vec<Target>, String> {
        Ok(vec![Target {
            id: "safe".into(),
            label: "Fixture".into(),
        }])
    }
    fn resolve(&self, _: &HostContext, id: &str) -> Result<LaunchSpec, String> {
        if id != "safe" {
            return Err("Unknown target".into());
        }
        let mut spec = LaunchSpec::new(
            Target {
                id: id.into(),
                label: "Fixture".into(),
            },
            &self.0,
        );
        spec.shell = "/bin/sh".into();
        spec.args.clear();
        Ok(spec)
    }
}
fn context(window: &str) -> HostContext {
    HostContext {
        window: window.into(),
        url: "tauri://localhost/".into(),
    }
}
#[test]
fn windows_cannot_list_attach_or_close_each_others_session() {
    let dir = tempfile::tempdir().unwrap();
    let host = TerminalHost::new(Arc::new(Policy(dir.path().into())), Config::default()).unwrap();
    let one = context("one");
    let two = context("two");
    let id = "11111111-1111-4111-8111-111111111111";
    host.open(&one, id, "safe", 80, 24).unwrap();
    let other = host.runtime(&two).unwrap();
    assert!(other.list().unwrap().is_empty());
    assert!(other.input(id, "bad").is_err());
    assert!(other.attach(id, Arc::new(|_| Ok(()))).is_err());
    other.close(id).unwrap();
    assert_eq!(host.runtime(&one).unwrap().list().unwrap().len(), 1);
    host.shutdown().unwrap();
}
#[test]
fn denied_origins_targets_and_shutdown_fail_closed() {
    let dir = tempfile::tempdir().unwrap();
    let host = TerminalHost::new(Arc::new(Policy(dir.path().into())), Config::default()).unwrap();
    let mut ctx = context("one");
    ctx.url = "https://example.invalid/".into();
    assert_eq!(host.targets(&ctx).unwrap_err().code, "denied");
    ctx = context("one");
    assert_eq!(
        host.open(
            &ctx,
            "11111111-1111-4111-8111-111111111111",
            "../../tmp",
            80,
            24
        )
        .unwrap_err()
        .code,
        "denied"
    );
    host.shutdown().unwrap();
    assert_eq!(host.targets(&ctx).unwrap_err().code, "disabled");
    assert!(host.enable().is_err());
}
#[test]
fn disabling_and_reenabling_never_resurrects_shells_or_request_ids() {
    let dir = tempfile::tempdir().unwrap();
    let host = TerminalHost::new(Arc::new(Policy(dir.path().into())), Config::default()).unwrap();
    let ctx = context("one");
    let id = "22222222-2222-4222-8222-222222222222";
    host.open(&ctx, id, "safe", 80, 24).unwrap();
    host.disable().unwrap();
    host.disable().unwrap();
    assert_eq!(host.targets(&ctx).unwrap_err().code, "disabled");
    host.enable().unwrap();
    assert!(host.runtime(&ctx).unwrap().list().unwrap().is_empty());
    assert!(host.open(&ctx, id, "safe", 80, 24).is_err());
    host.open(&ctx, "33333333-3333-4333-8333-333333333333", "safe", 80, 24)
        .unwrap();
    host.close_window("one").unwrap();
    assert!(host.runtime(&ctx).unwrap().list().unwrap().is_empty());
}
