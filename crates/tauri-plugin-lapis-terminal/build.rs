fn main() {
    tauri_plugin::Builder::new(&[
        "targets",
        "list",
        "open",
        "attach",
        "detach",
        "input",
        "resize",
        "scroll",
        "focus",
        "ack",
        "viewport_ready",
        "close",
    ])
    .build();
}
