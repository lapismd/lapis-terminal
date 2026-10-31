use super::*;
use std::sync::{TryLockError, mpsc};
use std::time::Duration;

fn text(frame: &Frame) -> String {
    frame
        .rows
        .iter()
        .flat_map(|row| &row.spans)
        .map(|span| span.text.as_str())
        .collect()
}

#[test]
fn output_during_attachment_reaches_bootstrap_or_exact_ack_successor() {
    let (terminal, _actions) = Terminal::new(Size::default(), Fences::default());
    let terminal = Arc::new(SharedTerminal::new(terminal));
    let viewport = terminal.lock().viewport();
    let publisher = Arc::new(Mutex::new(FramePublisher::new(viewport)));
    let subscription = SubscriptionId::new();
    let (start, started) = mpsc::channel();
    let (attempted, attempt) = mpsc::channel();
    let reader = {
        let terminal = terminal.clone();
        let publisher = publisher.clone();
        std::thread::spawn(move || {
            started.recv_timeout(Duration::from_secs(2)).unwrap();
            terminal.feed_fully(b"$ ");
            let frame = terminal.snapshot(&mut Encoder::new());
            match publisher.try_lock() {
                Ok(mut publisher) => {
                    let publication = publisher.offer(frame).unwrap();
                    attempted.send(()).unwrap();
                    publication
                }
                Err(TryLockError::WouldBlock) => {
                    attempted.send(()).unwrap();
                    publisher.lock().unwrap().offer(frame).unwrap()
                }
                Err(TryLockError::Poisoned(error)) => panic!("{error}"),
            }
        })
    };
    let bootstrap = capture_attachment(&publisher, subscription, || {
        let captured = terminal.snapshot(&mut Encoder::new());
        assert!(!text(&captured).contains('$'));
        start.send(()).unwrap();
        attempt.recv_timeout(Duration::from_secs(2)).unwrap();
        Ok(captured)
    })
    .unwrap();
    assert!(
        reader.join().unwrap().is_none(),
        "bootstrap holds frame credit"
    );
    assert_eq!(bootstrap.subscription_id, subscription);
    assert_eq!(bootstrap.sequence, 1);
    assert_eq!(bootstrap.frame.viewport, viewport);
    assert!(bootstrap.frame.full);

    let mut publisher = publisher.lock().unwrap();
    assert!(publisher.acknowledge(SubscriptionId::new(), 1).is_none());
    assert!(publisher.acknowledge(subscription, 2).is_none());
    let successor = publisher.acknowledge(subscription, 1);
    let delivered = text(&bootstrap.frame)
        + &successor
            .as_ref()
            .map(|value| text(&value.frame))
            .unwrap_or_default();
    assert!(delivered.contains("$ "), "initial output must not be lost");
    if let Some(successor) = successor {
        assert_eq!(successor.subscription_id, subscription);
        assert_eq!(successor.sequence, 2);
        assert_eq!(successor.frame.viewport, viewport);
        assert!(successor.frame.full);
        assert!(publisher.acknowledge(subscription, 1).is_none());
        assert!(publisher.acknowledge(subscription, 2).is_none());
    }
}

#[test]
fn stale_detach_cannot_clear_a_replacement_attachment_sink() {
    let (terminal, _actions) = Terminal::new(Size::default(), Fences::default());
    let terminal = Arc::new(SharedTerminal::new(terminal));
    terminal.feed_fully(b"$ ");
    let publisher = Arc::new(Mutex::new(FramePublisher::new(terminal.lock().viewport())));
    let sink = Arc::new(Mutex::new(Some("old")));
    let old = SubscriptionId::new();
    capture_attachment(&publisher, old, || {
        Ok(terminal.snapshot(&mut Encoder::new()))
    })
    .unwrap();

    let (start, started) = mpsc::channel();
    let (attempted, attempt) = mpsc::channel();
    let replacement = {
        let publisher = publisher.clone();
        let terminal = terminal.clone();
        let sink = sink.clone();
        std::thread::spawn(move || {
            started.recv_timeout(Duration::from_secs(2)).unwrap();
            let blocked = match publisher.try_lock() {
                Ok(guard) => {
                    drop(guard);
                    false
                }
                Err(TryLockError::WouldBlock) => true,
                Err(TryLockError::Poisoned(error)) => panic!("{error}"),
            };
            if blocked {
                attempted.send(()).unwrap();
            }
            let attached = capture_attachment(&publisher, SubscriptionId::new(), || {
                *sink.lock().unwrap() = Some("replacement");
                Ok(terminal.snapshot(&mut Encoder::new()))
            })
            .unwrap();
            if !blocked {
                attempted.send(()).unwrap();
            }
            attached
        })
    };
    detach_attachment(&publisher, old, || {
        start.send(()).unwrap();
        attempt.recv_timeout(Duration::from_secs(2)).unwrap();
        *sink.lock().unwrap() = None;
        Ok(())
    })
    .unwrap();
    let replacement = replacement.join().unwrap();
    assert_eq!(*sink.lock().unwrap(), Some("replacement"));
    assert!(text(&replacement.frame).contains("$ "));
    assert_ne!(replacement.subscription_id, old);
}
