use super::*;
use crate::transport::SubscriptionId;
use lapis_terminal_engine::{Fences, Size, Terminal, damage::Frame};
use std::{
    sync::{TryLockError, mpsc},
    time::Duration,
};

fn text(frame: &Frame) -> String {
    frame
        .rows
        .iter()
        .flat_map(|row| &row.spans)
        .map(|span| span.text.as_str())
        .collect()
}

#[test]
fn old_resize_snapshot_cannot_overwrite_newer_initial_output() {
    let (terminal, _actions) = Terminal::new(Size::default(), Fences::default());
    let terminal = Arc::new(SharedTerminal::new(terminal));
    let viewport = terminal.lock().viewport();
    let publisher = Arc::new(Mutex::new(FramePublisher::new(viewport)));
    let subscription = SubscriptionId::new();
    let bootstrap = publisher
        .lock()
        .unwrap()
        .attach(subscription, terminal.snapshot(&mut Encoder::new()))
        .unwrap();
    let (start, started) = mpsc::channel();
    let (attempted, attempt) = mpsc::channel();
    let reader = {
        let terminal = terminal.clone();
        let publisher = publisher.clone();
        std::thread::spawn(move || {
            started.recv_timeout(Duration::from_secs(2)).unwrap();
            terminal.feed_fully(b"$ ");
            let publication = match publisher.try_lock() {
                Ok(mut publisher) => {
                    let value = publisher
                        .offer(terminal.snapshot(&mut Encoder::new()))
                        .unwrap();
                    attempted.send(()).unwrap();
                    value
                }
                Err(TryLockError::WouldBlock) => {
                    attempted.send(()).unwrap();
                    capture_publication(&publisher, |_| terminal.snapshot(&mut Encoder::new()))
                        .unwrap()
                }
                Err(TryLockError::Poisoned(error)) => panic!("{error}"),
            };
            assert!(publication.is_none(), "bootstrap still owns frame credit");
        })
    };
    let old_resize = capture_publication(&publisher, |_| {
        let captured = terminal.snapshot(&mut Encoder::new());
        assert!(!text(&captured).contains('$'));
        start.send(()).unwrap();
        attempt.recv_timeout(Duration::from_secs(2)).unwrap();
        captured
    })
    .unwrap();
    assert!(old_resize.is_none());
    reader.join().unwrap();
    let successor = publisher
        .lock()
        .unwrap()
        .acknowledge(subscription, bootstrap.sequence)
        .unwrap();
    assert!(successor.frame.full);
    assert_eq!(successor.frame.viewport, viewport);
    assert!(
        text(&successor.frame).contains("$ "),
        "an older resize snapshot must not erase newer idle shell output"
    );
}
