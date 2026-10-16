use super::{
    Config, LaunchSpec, Result, Sink, Target,
    io::{self, Output},
    transport::{FramePublisher, SubscriptionId},
    wire::{AttachResponse, WireViewport},
};
use lapis_terminal_engine::{Fences, SharedTerminal, Size, Terminal, damage::Encoder};
use portable_pty::{CommandBuilder, MasterPty, PtySize, native_pty_system};
use serde::Serialize;
use std::{
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
        mpsc::{self, SyncSender},
    },
    thread::JoinHandle,
};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub id: String,
    pub target: Target,
    pub title: String,
    pub exited: bool,
}
pub(super) struct Session {
    id: Uuid,
    pub target: LaunchSpec,
    output: Arc<Output>,
    master: Mutex<Option<Box<dyn MasterPty + Send>>>,
    child: Mutex<Option<Box<dyn portable_pty::Child + Send + Sync>>>,
    input: SyncSender<Vec<u8>>,
    threads: Mutex<Vec<JoinHandle<()>>>,
    scrollback: usize,
}
fn size(columns: u16, rows: u16, scrollback: usize) -> Result<Size> {
    if !(2..=512).contains(&columns) || !(1..=200).contains(&rows) {
        return Err("Terminal dimensions exceed limits".into());
    }
    Ok(Size {
        columns: columns.into(),
        screen_lines: rows.into(),
        scrollback,
    })
}
fn pty_size(columns: u16, rows: u16) -> PtySize {
    PtySize {
        cols: columns,
        rows,
        pixel_width: 0,
        pixel_height: 0,
    }
}
impl Session {
    pub fn spawn(
        id: Uuid,
        target: LaunchSpec,
        columns: u16,
        rows: u16,
        config: &Config,
    ) -> Result<Self> {
        let dimensions = size(columns, rows, config.scrollback)?;
        let path = target.cwd.as_path();
        if !path.is_absolute() || !path.is_dir() {
            return Err("Linked folder is unavailable".into());
        }
        let pair = native_pty_system()
            .openpty(pty_size(columns, rows))
            .map_err(|e| e.to_string())?;
        let fd = pair
            .master
            .as_raw_fd()
            .ok_or("PTY descriptor unavailable")?;
        crate::pty_io::nonblocking(fd).map_err(|e| e.to_string())?;
        let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
        if !crate::shell::is_executable_file(std::path::Path::new(&target.shell)) {
            return Err("Selected shell is not an executable file".into());
        }
        let mut command = CommandBuilder::new(&target.shell);
        command.args(&target.args);
        crate::env_fence::fence_env(&mut command, &crate::path::user_shell_path(), &target.shell);
        command.env("TERM_PROGRAM", &config.application);
        for (key, value) in &target.env {
            command.env(key, value);
        }
        command.cwd(path);
        let child = pair
            .slave
            .spawn_command(command)
            .map_err(|e| e.to_string())?;
        drop(pair.slave);
        let (terminal, actions) = Terminal::new(dimensions, Fences::default());
        let terminal = Arc::new(SharedTerminal::new(terminal));
        let viewport = terminal.lock().viewport();
        let output = Arc::new(Output {
            terminal,
            publisher: Mutex::new(FramePublisher::new(viewport)),
            sink: Mutex::new(None),
            title: Mutex::new("Shell".into()),
            exited: AtomicBool::new(false),
            stopping: AtomicBool::new(false),
        });
        let (input, receiver) = mpsc::sync_channel(16);
        let threads = vec![
            io::reader(reader, fd, output.clone()),
            io::writer(writer, receiver, output.clone()),
            io::actions(actions, input.clone(), output.clone()),
        ];
        Ok(Self {
            id,
            target,
            output,
            master: Mutex::new(Some(pair.master)),
            child: Mutex::new(Some(child)),
            input,
            threads: Mutex::new(threads),
            scrollback: config.scrollback,
        })
    }
    pub fn info(&self) -> Result<SessionInfo> {
        Ok(SessionInfo {
            id: self.id.to_string(),
            target: self.target.target.clone(),
            title: self.output.title.lock().map_err(|e| e.to_string())?.clone(),
            exited: self.output.exited.load(Ordering::Acquire),
        })
    }
    pub fn attach(&self, sink: Sink) -> Result<AttachResponse> {
        let subscription = SubscriptionId::new();
        let frame = self.output.terminal.snapshot(&mut Encoder::new());
        let viewport = frame.viewport;
        *self.output.sink.lock().map_err(|e| e.to_string())? = Some(sink);
        let publication = self
            .output
            .publisher
            .lock()
            .map_err(|e| e.to_string())?
            .attach(subscription, frame)
            .map_err(|_| "Invalid terminal snapshot")?;
        self.output.publish(publication)?;
        if self.output.exited.load(Ordering::Acquire) {
            self.output.send(super::wire::TerminalMessage::Exit)?;
        }
        Ok(AttachResponse {
            session_id: self.id.to_string(),
            subscription_id: subscription.to_string(),
            viewport: viewport.into(),
        })
    }
    pub fn detach(&self, subscription: &str) -> Result<()> {
        let removed = self
            .output
            .publisher
            .lock()
            .map_err(|e| e.to_string())?
            .fault(SubscriptionId::parse(subscription)?);
        if removed {
            *self.output.sink.lock().map_err(|e| e.to_string())? = None;
        }
        Ok(())
    }
    pub fn input(&self, data: &str) -> Result<()> {
        if self.output.terminal.is_closing()
            || self.output.exited.load(Ordering::Acquire)
            || self.output.stopping.load(Ordering::Acquire)
        {
            return Err("Terminal session has exited".into());
        }
        if data.len() > 64 * 1024 {
            return Err("Terminal input exceeds 64 KiB".into());
        }
        self.input
            .try_send(data.as_bytes().to_vec())
            .map_err(|_| "Terminal input is busy; retry when the program is ready")?;
        if self.output.terminal.scroll_to_bottom() {
            self.output.snapshot()?;
        }
        Ok(())
    }
    pub fn resize(&self, columns: u16, rows: u16) -> Result<WireViewport> {
        let dimensions = size(columns, rows, self.scrollback)?;
        self.master
            .lock()
            .map_err(|e| e.to_string())?
            .as_ref()
            .ok_or("Terminal is closing")?
            .resize(pty_size(columns, rows))
            .map_err(|e| e.to_string())?;
        let viewport = self.output.terminal.resize(dimensions);
        self.output
            .publisher
            .lock()
            .map_err(|e| e.to_string())?
            .resize_applied(viewport);
        self.output.snapshot()?;
        Ok(viewport.into())
    }
    pub fn scroll(&self, lines: i32) -> Result<()> {
        if self.output.terminal.scroll(lines.saturating_neg()) {
            self.output.snapshot()?;
        }
        Ok(())
    }
    pub fn focus(&self, focused: bool) -> Result<()> {
        if self.output.terminal.input_modes().1 {
            self.input(if focused { "\x1b[I" } else { "\x1b[O" })?;
        }
        Ok(())
    }
    pub fn acknowledge(&self, subscription: &str, sequence: u64) -> Result<()> {
        let publication = self
            .output
            .publisher
            .lock()
            .map_err(|e| e.to_string())?
            .acknowledge(SubscriptionId::parse(subscription)?, sequence);
        if let Some(publication) = publication {
            self.output.publish(publication)?;
        }
        Ok(())
    }
    pub fn viewport_ready(&self, subscription: &str, viewport: WireViewport) -> Result<()> {
        let publication = self
            .output
            .publisher
            .lock()
            .map_err(|e| e.to_string())?
            .viewport_ready(SubscriptionId::parse(subscription)?, viewport.into());
        if let Some(publication) = publication {
            self.output.publish(publication)?;
        }
        Ok(())
    }
    pub fn shutdown(&self) -> Result<()> {
        self.output.terminal.begin_closing();
        self.output
            .publisher
            .lock()
            .map_err(|e| e.to_string())?
            .close();
        let result = if let Some(mut child) = self.child.lock().map_err(|e| e.to_string())?.take() {
            #[cfg(target_os = "macos")]
            let descendants = child
                .process_id()
                .map(|pid| crate::process_tree::descendants(pid as i32))
                .transpose();
            #[cfg(target_os = "macos")]
            if let Ok(Some(children)) = &descendants {
                crate::process_tree::signal(children, false);
            }
            let result = crate::lifecycle::shutdown(&mut child)
                .map(|_| ())
                .map_err(|e| e.to_string());
            #[cfg(target_os = "macos")]
            {
                if let Ok(Some(children)) = &descendants {
                    crate::process_tree::signal(children, true);
                }
                result.and(descendants.map(|_| ()).map_err(|e| e.to_string()))
            }
            #[cfg(not(target_os = "macos"))]
            result
        } else {
            Ok(())
        };
        self.output.stopping.store(true, Ordering::Release);
        for thread in std::mem::take(&mut *self.threads.lock().map_err(|e| e.to_string())?) {
            let _ = thread.join();
        }
        self.master.lock().map_err(|e| e.to_string())?.take();
        self.output.sink.lock().map_err(|e| e.to_string())?.take();
        result
    }
}
