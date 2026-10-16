use lapis_terminal_runtime::{LaunchSpec, Runtime, Target, wire::TerminalMessage};
use std::{
    sync::{Arc, mpsc},
    time::{Duration, Instant},
};
fn main() -> Result<(), String> {
    let directory = tempfile::tempdir().map_err(|e| e.to_string())?;
    let runtime = Runtime::default();
    let mut launch = LaunchSpec::new(
        Target {
            id: "example".into(),
            label: "Temporary workspace".into(),
        },
        directory.path(),
    );
    launch.shell = "/bin/sh".into();
    launch.args.clear();
    let session = runtime.open("11111111-1111-4111-8111-111111111111", launch, 80, 24)?;
    let (send, receive) = mpsc::channel();
    runtime.attach(
        &session.id,
        Arc::new(move |event| send.send(event).map_err(|e| e.to_string())),
    )?;
    runtime.input(&session.id, "printf '\\nLAPIS_%s\\n' READY\r")?;
    let deadline = Instant::now() + Duration::from_secs(5);
    while Instant::now() < deadline {
        if let Ok(TerminalMessage::Frame(frame)) = receive.recv_timeout(Duration::from_millis(50)) {
            let text: String = frame
                .rows
                .iter()
                .flat_map(|row| {
                    row.spans
                        .iter()
                        .flat_map(|span| span.clusters.iter().map(|c| c.text.as_str()))
                })
                .collect();
            runtime.acknowledge(&session.id, &frame.subscription_id, frame.sequence)?;
            if text.contains("LAPIS_READY") {
                runtime.close(&session.id)?;
                println!("Native terminal example passed");
                return Ok(());
            }
        }
    }
    Err("Timed out waiting for PTY output".into())
}
