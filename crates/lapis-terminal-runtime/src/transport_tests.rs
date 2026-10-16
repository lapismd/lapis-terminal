use super::*;
use lapis_terminal_engine::damage::{CursorFrame, RowFrame};

fn viewport(generation: u64, columns: usize, screen_lines: usize) -> Viewport {
    Viewport {
        generation,
        columns,
        screen_lines,
    }
}

fn frame(viewport: Viewport, marker: usize, full: bool) -> Frame {
    Frame {
        rows: vec![RowFrame {
            line: marker,
            wrapped: false,
            spans: Vec::new(),
        }],
        cursor: CursorFrame {
            line: 0,
            column: 0,
            visible: true,
        },
        cursor_changed: true,
        full,
        viewport,
    }
}

#[test]
fn attach_bootstraps_then_ack_releases_only_latest_snapshot() {
    let v0 = viewport(0, 80, 24);
    let mut publisher = FramePublisher::new(v0);
    let id = SubscriptionId::new();
    let bootstrap = publisher.attach(id, frame(v0, 0, true)).unwrap();
    assert_eq!(bootstrap.sequence, 1);
    assert!(publisher.requires_snapshot());

    assert_eq!(publisher.offer(frame(v0, 1, true)).unwrap(), None);
    assert_eq!(publisher.offer(frame(v0, 2, true)).unwrap(), None);
    let successor = publisher.acknowledge(id, 1).unwrap();
    assert_eq!(successor.sequence, 2);
    assert_eq!(successor.frame.rows[0].line, 2);
}

#[test]
fn pending_incremental_frame_is_rejected_instead_of_losing_damage() {
    let v0 = viewport(0, 80, 24);
    let mut publisher = FramePublisher::new(v0);
    let id = SubscriptionId::new();
    publisher.attach(id, frame(v0, 0, true)).unwrap();
    assert_eq!(
        publisher.offer(frame(v0, 1, false)),
        Err(OfferError::PendingFrameMustBeSnapshot)
    );
}

#[test]
fn late_old_frame_is_acked_but_never_crosses_viewports() {
    let v0 = viewport(0, 80, 24);
    let v1 = viewport(1, 100, 30);
    let mut publisher = FramePublisher::new(v0);
    let id = SubscriptionId::new();
    publisher.attach(id, frame(v0, 0, true)).unwrap();

    publisher.resize_applied(v1);
    assert_eq!(publisher.offer(frame(v0, 7, true)).unwrap(), None);
    assert_eq!(publisher.offer(frame(v1, 8, true)).unwrap(), None);
    assert_eq!(publisher.acknowledge(id, 1), None);
    let current = publisher.viewport_ready(id, v1).unwrap();
    assert_eq!(current.frame.viewport, v1);
    assert_eq!(current.frame.rows[0].line, 8);
}

#[test]
fn early_new_frame_is_held_despite_real_capture_pressure() {
    let v0 = viewport(0, 80, 24);
    let v1 = viewport(1, 120, 40);
    let mut publisher = FramePublisher::new(v0);
    let id = SubscriptionId::new();
    publisher.attach(id, frame(v0, 0, true)).unwrap();
    publisher.acknowledge(id, 1);

    publisher.resize_applied(v1);
    // A real non-empty capture occurred. Zero publication before readiness
    // therefore cannot pass vacuously because no output happened.
    let captured = frame(v1, 9, true);
    assert!(!captured.rows.is_empty());
    assert_eq!(publisher.offer(captured).unwrap(), None);
    let publication = publisher.viewport_ready(id, v1).unwrap();
    assert_eq!(publication.frame.rows[0].line, 9);
    assert_eq!(publication.frame.viewport, v1);
}

#[test]
fn ack_and_readiness_may_arrive_in_either_order() {
    let v0 = viewport(0, 80, 24);
    let v1 = viewport(1, 100, 30);
    let mut publisher = FramePublisher::new(v0);
    let id = SubscriptionId::new();
    publisher.attach(id, frame(v0, 0, true)).unwrap();
    publisher.resize_applied(v1);
    publisher.offer(frame(v1, 1, true)).unwrap();

    assert_eq!(publisher.viewport_ready(id, v1), None);
    assert!(publisher.acknowledge(id, 1).is_some());
}

#[test]
fn superseded_readiness_and_same_size_resize_are_inert() {
    let v0 = viewport(0, 80, 24);
    let v1 = viewport(1, 100, 30);
    let v2 = viewport(2, 120, 40);
    let mut publisher = FramePublisher::new(v0);
    let id = SubscriptionId::new();
    publisher.attach(id, frame(v0, 0, true)).unwrap();
    publisher.resize_applied(v1);
    publisher.resize_applied(v2);
    publisher.resize_applied(v2);
    assert_eq!(publisher.applied, v2);
    publisher.offer(frame(v2, 2, true)).unwrap();
    publisher.acknowledge(id, 1);
    assert_eq!(publisher.viewport_ready(id, v1), None);
    assert!(publisher.viewport_ready(id, v2).is_some());
}

#[test]
fn old_subscription_messages_cannot_release_reattached_subscription() {
    let v0 = viewport(0, 80, 24);
    let mut publisher = FramePublisher::new(v0);
    let old = SubscriptionId::new();
    publisher.attach(old, frame(v0, 0, true)).unwrap();
    assert!(publisher.fault(old));

    let new = SubscriptionId::new();
    publisher.attach(new, frame(v0, 1, true)).unwrap();
    publisher.offer(frame(v0, 2, true)).unwrap();
    assert_eq!(publisher.acknowledge(old, 1), None);
    assert_eq!(publisher.viewport_ready(old, v0), None);
    let successor = publisher.acknowledge(new, 1).unwrap();
    assert_eq!(successor.frame.rows[0].line, 2);
}

#[test]
fn stale_fault_cannot_detach_current_subscription() {
    let v0 = viewport(0, 80, 24);
    let mut publisher = FramePublisher::new(v0);
    let old = SubscriptionId::new();
    let new = SubscriptionId::new();
    publisher.attach(old, frame(v0, 0, true)).unwrap();
    publisher.attach(new, frame(v0, 1, true)).unwrap();
    assert!(!publisher.fault(old));
    assert!(publisher.fault(new));
}
