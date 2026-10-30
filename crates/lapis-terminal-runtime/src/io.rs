use super::{
    Result, Sink,
    transport::{FramePublisher, Publication},
    wire::{TerminalMessage, wire_publication},
};
use lapis_terminal_engine::{SharedTerminal, damage::Encoder};
use std::{
    io::{Read, Write},
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
        mpsc::{Receiver, SyncSender},
    },
    thread::JoinHandle,
};

pub(super) struct Output {
    pub terminal: Arc<SharedTerminal>,
    pub publisher: Mutex<FramePublisher>,
    pub sink: Mutex<Option<Sink>>,
    pub title: Mutex<String>,
    pub exited: AtomicBool,
    pub stopping: AtomicBool,
}
fn capture_publication(
    publisher: &Mutex<FramePublisher>,
    capture: impl FnOnce(bool) -> lapis_terminal_engine::damage::Frame,
) -> Result<Option<Publication>> {
    // Serialize captures with offers: an older full capture must never replace
    // newer pending output. All nested locking follows publisher -> engine.
    let mut publisher = publisher.lock().map_err(|e| e.to_string())?;
    let frame = capture(publisher.requires_snapshot());
    if frame.is_empty() {
        return Ok(None);
    }
    publisher
        .offer(frame)
        .map_err(|_| "Invalid terminal frame".into())
}
impl Output {
    pub fn send(&self, message: TerminalMessage) -> Result<()> {
        if let Some(sink) = self.sink.lock().map_err(|e| e.to_string())?.as_ref() {
            sink(message)?;
        }
        Ok(())
    }
    pub fn publish(&self, publication: Publication) -> Result<()> {
        let subscription = publication.subscription_id;
        let result = (|| {
            let mut frame = wire_publication(publication)?;
            let (paste, focus) = self.terminal.input_modes();
            frame.bracketed_paste = paste;
            frame.focus_reporting = focus;
            let title = self.title.lock().map_err(|e| e.to_string())?.clone();
            self.send(TerminalMessage::Title(title))?;
            self.send(TerminalMessage::Frame(frame))
        })();
        if result.is_err() {
            self.publisher
                .lock()
                .map_err(|e| e.to_string())?
                .fault(subscription);
        }
        result
    }
    pub fn snapshot(&self) -> Result<()> {
        let mut encoder = Encoder::new();
        let publication =
            capture_publication(&self.publisher, |_| self.terminal.snapshot(&mut encoder))?;
        if let Some(publication) = publication {
            self.publish(publication)?;
        }
        Ok(())
    }
}

#[cfg(test)]
#[path = "io_snapshot_tests.rs"]
mod tests;
pub(super) fn reader(
    mut input: Box<dyn Read + Send>,
    fd: i32,
    state: Arc<Output>,
) -> JoinHandle<()> {
    std::thread::spawn(move || {
        let mut buffer = [0; 16 * 1024];
        let mut encoder = Encoder::new();
        let mut snapshots = Encoder::new();
        while !state.stopping.load(Ordering::Acquire) {
            if !crate::pty_io::readable(fd) {
                continue;
            }
            let count = match input.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => n,
                Err(e)
                    if matches!(
                        e.kind(),
                        std::io::ErrorKind::WouldBlock | std::io::ErrorKind::Interrupted
                    ) =>
                {
                    continue;
                }
                Err(_) => break,
            };
            if state.terminal.is_closing() {
                continue;
            }
            let mut pending = state.terminal.feed(&buffer[..count]);
            while pending && !state.stopping.load(Ordering::Acquire) && !state.terminal.is_closing()
            {
                pending = state.terminal.drain();
            }
            if state.terminal.is_closing() {
                continue;
            }
            let publication = match capture_publication(&state.publisher, |snapshot| {
                if snapshot {
                    state.terminal.snapshot(&mut snapshots)
                } else {
                    state.terminal.render(&mut encoder)
                }
            }) {
                Ok(value) => value,
                Err(_) => break,
            };
            if let Some(publication) = publication {
                let _ = state.publish(publication);
            }
        }
        state.exited.store(true, Ordering::Release);
        let _ = state.send(TerminalMessage::Exit);
    })
}
pub(super) fn writer(
    mut output: Box<dyn Write + Send>,
    receiver: Receiver<Vec<u8>>,
    state: Arc<Output>,
) -> JoinHandle<()> {
    std::thread::spawn(move || {
        while !state.stopping.load(Ordering::Acquire) {
            let bytes = match receiver.recv_timeout(std::time::Duration::from_millis(25)) {
                Ok(bytes) => bytes,
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
                Err(_) => break,
            };
            let mut remaining = bytes.as_slice();
            while !remaining.is_empty() && !state.stopping.load(Ordering::Acquire) {
                match output.write(remaining) {
                    Ok(0) => return,
                    Ok(n) => remaining = &remaining[n..],
                    Err(e)
                        if matches!(
                            e.kind(),
                            std::io::ErrorKind::WouldBlock | std::io::ErrorKind::Interrupted
                        ) =>
                    {
                        std::thread::sleep(std::time::Duration::from_millis(10))
                    }
                    Err(_) => return,
                }
            }
        }
    })
}
pub(super) fn actions(
    receiver: Receiver<lapis_terminal_engine::Action>,
    input: SyncSender<Vec<u8>>,
    state: Arc<Output>,
) -> JoinHandle<()> {
    std::thread::spawn(move || {
        while !state.stopping.load(Ordering::Acquire) {
            let action = match receiver.recv_timeout(std::time::Duration::from_millis(25)) {
                Ok(action) => action,
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
                Err(_) => break,
            };
            use lapis_terminal_engine::Action;
            match action {
                Action::Title(title) => {
                    if let Ok(mut value) = state.title.lock() {
                        *value = title;
                    }
                }
                Action::ResetTitle => {
                    if let Ok(mut value) = state.title.lock() {
                        *value = "Shell".into();
                    }
                }
                other => {
                    let size = state.terminal.lock().size();
                    if let Some(reply) = lapis_terminal_engine::listener::reply(
                        other,
                        size.columns as u16,
                        size.screen_lines as u16,
                        8,
                        17,
                    ) {
                        let _ = input.try_send(reply.into_bytes());
                    }
                }
            }
        }
    })
}
