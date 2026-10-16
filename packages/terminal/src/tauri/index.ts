import { invoke, Channel } from "@tauri-apps/api/core";
import { createTerminalClient } from "../client.js";
import type {
  ClientOptions,
  TerminalMessage,
  TerminalTransport,
} from "../protocol.js";
/** The host must register tauri-plugin-lapis-terminal and grant scoped commands. */
export function createTauriTerminalTransport(): TerminalTransport {
  const call = <T>(name: string, args?: Record<string, unknown>) =>
    invoke<T>(`plugin:lapis-terminal|${name}`, args);
  return {
    targets: () => call("targets"),
    list: () => call("list"),
    open: (options) =>
      call("open", {
        requestId: options.requestId,
        targetId: options.targetId,
        columns: options.columns ?? 80,
        rows: options.rows ?? 24,
      }),
    attach: (sessionId, receive) =>
      call("attach", {
        sessionId,
        onFrame: new Channel<TerminalMessage>(receive),
      }),
    detach: (sessionId, subscriptionId) =>
      call("detach", { sessionId, subscriptionId }),
    input: (sessionId, data) => call("input", { sessionId, data }),
    resize: (sessionId, columns, rows) =>
      call("resize", { sessionId, columns, rows }),
    scroll: (sessionId, lines) => call("scroll", { sessionId, lines }),
    focus: (sessionId, focused) => call("focus", { sessionId, focused }),
    ack: (sessionId, subscriptionId, sequence) =>
      call("ack", { sessionId, subscriptionId, sequence }),
    ready: (sessionId, subscriptionId, viewport) =>
      call("viewport_ready", { sessionId, subscriptionId, viewport }),
    close: (sessionId) => call("close", { sessionId }),
  };
}
export function createTauriTerminalClient(options?: ClientOptions) {
  return createTerminalClient(createTauriTerminalTransport(), options);
}
