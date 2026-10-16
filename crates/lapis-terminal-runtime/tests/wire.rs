use lapis_terminal_runtime::wire::*;
#[test]
fn public_frame_matches_the_shared_typescript_fixture() {
    let message = TerminalMessage::Frame(FrameMessage {
        subscription_id: "fixture-subscription".into(),
        sequence: 1,
        rows: vec![WireRow {
            line: 0,
            wrapped: false,
            spans: vec![WireSpan {
                style: WireStyle {
                    fg: 0,
                    bg: 0,
                    flags: 0,
                },
                clusters: vec![WireCluster {
                    column: 0,
                    text: "界".into(),
                    width: 2,
                }],
            }],
        }],
        cursor: WireCursor {
            line: 0,
            column: 2,
            visible: true,
        },
        full: true,
        viewport: WireViewport {
            generation: 3,
            columns: 80,
            screen_lines: 24,
        },
        bracketed_paste: true,
        focus_reporting: false,
    });
    let expected: serde_json::Value =
        serde_json::from_str(include_str!("fixtures/frame.json")).unwrap();
    assert_eq!(serde_json::to_value(message).unwrap(), expected);
}
