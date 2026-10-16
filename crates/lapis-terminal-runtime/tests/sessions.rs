use lapis_terminal_runtime::{LaunchSpec, Runtime, Target, wire::TerminalMessage};
use std::{
    sync::{Arc, mpsc},
    time::{Duration, Instant},
};
fn target(folder: &std::path::Path) -> LaunchSpec {
    let mut spec = LaunchSpec::new(
        Target {
            id: "fixture".into(),
            label: "Fixture".into(),
        },
        folder,
    );
    spec.shell = "/bin/sh".into();
    spec.args = vec![];
    spec
}
fn wait_text(
    runtime: &Runtime,
    id: &str,
    rx: &mpsc::Receiver<TerminalMessage>,
    marker: &str,
) -> String {
    let deadline = Instant::now() + Duration::from_secs(8);
    loop {
        assert!(
            Instant::now() < deadline,
            "missing terminal output: {marker}"
        );
        if let Ok(TerminalMessage::Frame(frame)) = rx.recv_timeout(Duration::from_millis(100)) {
            let text = frame
                .rows
                .iter()
                .map(|row| {
                    row.spans
                        .iter()
                        .flat_map(|span| span.clusters.iter().map(|c| c.text.as_str()))
                        .collect::<String>()
                })
                .collect::<Vec<_>>()
                .join("\n");
            runtime
                .acknowledge(id, &frame.subscription_id, frame.sequence)
                .unwrap();
            if text.contains(marker) {
                return text;
            }
        }
    }
}
#[test]
fn repository_session_reuses_open_identity_and_retains_detached_output() {
    let folder = tempfile::tempdir().unwrap();
    let runtime = Runtime::default();
    let request = "11111111-1111-4111-8111-111111111111";
    let first = runtime
        .open(request, target(folder.path()), 120, 24)
        .unwrap();
    assert_eq!(
        runtime
            .open(request, target(folder.path()), 120, 24)
            .unwrap()
            .id,
        first.id
    );
    let (send, receive) = mpsc::channel();
    let attached = runtime
        .attach(
            &first.id,
            Arc::new(move |message| send.send(message).map_err(|e| e.to_string())),
        )
        .unwrap();
    runtime
        .input(&first.id, "printf '\\nREPO:%s\\n' \"$PWD\"\r")
        .unwrap();
    let output = wait_text(
        &runtime,
        &first.id,
        &receive,
        &format!("REPO:{}", folder.path().canonicalize().unwrap().display()),
    );
    assert!(output.contains("REPO:/"));
    runtime
        .detach(&first.id, &attached.subscription_id)
        .unwrap();
    runtime
        .input(&first.id, "printf '\\n%s_%s\\n' RETAINED SHELL\r")
        .unwrap();
    std::thread::sleep(Duration::from_millis(200));
    let (send, receive) = mpsc::channel();
    let next = runtime
        .attach(
            &first.id,
            Arc::new(move |message| send.send(message).map_err(|e| e.to_string())),
        )
        .unwrap();
    assert_ne!(attached.subscription_id, next.subscription_id);
    wait_text(&runtime, &first.id, &receive, "RETAINED_SHELL");
    assert_eq!(runtime.list().unwrap().len(), 1);
    let started = Instant::now();
    runtime.close(&first.id).unwrap();
    assert!(started.elapsed() < Duration::from_secs(3));
    assert!(runtime.list().unwrap().is_empty());
}
#[test]
fn resource_limits_and_conflicting_open_ids_are_rejected() {
    let folder = tempfile::tempdir().unwrap();
    let runtime = Runtime::default();
    let id = "22222222-2222-4222-8222-222222222222";
    assert!(runtime.open(id, target(folder.path()), 513, 24).is_err());
    assert!(runtime.open(id, target(folder.path()), 80, 0).is_err());
    runtime.open(id, target(folder.path()), 80, 24).unwrap();
    let mut other = target(folder.path());
    other.target.id = "a".repeat(32);
    assert!(runtime.open(id, other, 80, 24).is_err());
    assert!(runtime.input(id, &"a".repeat(65537)).is_err());
    runtime.close(id).unwrap();
    runtime.close(id).unwrap();
    assert!(runtime.open(id, target(folder.path()), 80, 24).is_err());
}
#[test]
fn closing_a_noisy_detached_shell_is_bounded() {
    let folder = tempfile::tempdir().unwrap();
    let runtime = Runtime::default();
    let id = "33333333-3333-4333-8333-333333333333";
    runtime.open(id, target(folder.path()), 80, 24).unwrap();
    runtime
        .input(id, "while true; do printf 'busy output\\n'; done\r")
        .unwrap();
    std::thread::sleep(Duration::from_millis(100));
    let start = Instant::now();
    runtime.close(id).unwrap();
    assert!(start.elapsed() < Duration::from_secs(3));
}

#[cfg(target_os = "macos")]
#[test]
fn closing_terminal_ends_background_job_in_separate_process_group() {
    let folder = tempfile::tempdir().unwrap();
    let runtime = Runtime::default();
    let id = "44444444-4444-4444-8444-444444444444";
    runtime.open(id, target(folder.path()), 80, 24).unwrap();
    runtime
        .input(id, "/bin/sleep 60 & echo $! > job.pid\r")
        .unwrap();
    let file = folder.path().join("job.pid");
    let deadline = Instant::now() + Duration::from_secs(5);
    while !file.exists() && Instant::now() < deadline {
        std::thread::sleep(Duration::from_millis(20));
    }
    let pid = std::fs::read_to_string(file).unwrap().trim().to_owned();
    assert!(pid.parse::<u32>().unwrap() > 1);
    runtime.close(id).unwrap();
    let alive = || {
        std::process::Command::new("/bin/kill")
            .args(["-0", &pid])
            .stderr(std::process::Stdio::null())
            .status()
            .unwrap()
            .success()
    };
    let deadline = Instant::now() + Duration::from_secs(3);
    while alive() && Instant::now() < deadline {
        std::thread::sleep(Duration::from_millis(20));
    }
    assert!(!alive(), "background job outlived terminal close");
}
