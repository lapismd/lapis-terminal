import type { TerminalFrame, TerminalViewport } from "./renderer.js";
export type TerminalTarget = { id: string; label: string };
export type SessionInfo = {
  id: string;
  target: TerminalTarget;
  title: string;
  exited: boolean;
};
export type FrameMessage = TerminalFrame & {
  subscriptionId: string;
  sequence: number;
  bracketedPaste: boolean;
  focusReporting: boolean;
};
export type TerminalMessage =
  | { type: "frame"; payload: FrameMessage }
  | { type: "title"; payload: string }
  | { type: "exit" | "resetTitle" | "bell" };
export type Attachment = {
  sessionId: string;
  subscriptionId: string;
  viewport: TerminalViewport;
};
export type OpenOptions = {
  targetId: string;
  requestId: string;
  columns?: number;
  rows?: number;
};
export interface TerminalTransport {
  targets(): Promise<TerminalTarget[]>;
  list(): Promise<SessionInfo[]>;
  open(options: OpenOptions): Promise<SessionInfo>;
  attach(
    sessionId: string,
    receive: (message: TerminalMessage) => void,
  ): Promise<Attachment>;
  detach(sessionId: string, subscriptionId: string): Promise<void>;
  input(sessionId: string, data: string): Promise<void>;
  resize(
    sessionId: string,
    columns: number,
    rows: number,
  ): Promise<TerminalViewport>;
  scroll(sessionId: string, lines: number): Promise<void>;
  focus(sessionId: string, focused: boolean): Promise<void>;
  ack(
    sessionId: string,
    subscriptionId: string,
    sequence: number,
  ): Promise<void>;
  ready(
    sessionId: string,
    subscriptionId: string,
    viewport: TerminalViewport,
  ): Promise<void>;
  close(sessionId: string): Promise<void>;
}
export type ErrorCode = "denied" | "disabled" | "unavailable" | "runtime";
export class TerminalError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TerminalError";
  }
  static from(error: unknown): TerminalError {
    if (error instanceof TerminalError) return error;
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error
    ) {
      const codes: readonly string[] = [
        "denied",
        "disabled",
        "unavailable",
        "runtime",
      ];
      return new TerminalError(
        codes.includes(String(error.code))
          ? (error.code as ErrorCode)
          : "runtime",
        String(error.message),
      );
    }
    return new TerminalError(
      "runtime",
      error instanceof Error ? error.message : String(error),
    );
  }
}
export type ClientOptions = {
  onError?: (error: TerminalError, sessionId?: string) => void;
  onBell?: (sessionId: string) => void;
};
