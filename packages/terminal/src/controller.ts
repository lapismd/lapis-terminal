import { TerminalGrid } from "./renderer.js";
import { TerminalError } from "./protocol.js";
import type {
  Attachment,
  ClientOptions,
  FrameMessage,
  SessionInfo,
  TerminalMessage,
  TerminalTransport,
} from "./protocol.js";

export type SessionSnapshot = {
  info: SessionInfo;
  grid?: TerminalGrid;
  attached: boolean;
  paste: boolean;
  revision: number;
};
/** Headless session view. Disposal releases subscriptions, never the PTY. */
export class TerminalSession {
  #state: SessionSnapshot;
  #listeners = new Set<(state: SessionSnapshot) => void>();
  #attachment?: Attachment;
  #epoch = 0;
  #closed = false;
  #pending?: [number, number];
  #desired?: [number, number];
  #resizing?: Promise<void>;
  #resizeEpoch = 0;
  constructor(
    private transport: TerminalTransport,
    info: SessionInfo,
    private options: ClientOptions = {},
  ) {
    this.#state = { info, attached: false, paste: false, revision: 0 };
  }
  get id() {
    return this.#state.info.id;
  }
  get snapshot() {
    return this.#state;
  }
  subscribe(listener: (state: SessionSnapshot) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #changed() {
    this.#state = { ...this.#state, revision: this.#state.revision + 1 };
    for (const listener of this.#listeners) listener(this.#state);
  }
  async #call<T>(action: () => Promise<T>, epoch = this.#epoch): Promise<T> {
    try {
      return await action();
    } catch (cause) {
      const error = TerminalError.from(cause);
      if (epoch === this.#epoch && !this.#closed)
        this.options.onError?.(error, this.id);
      throw error;
    }
  }
  async attach(): Promise<void> {
    await this.detach();
    if (this.#closed)
      throw new TerminalError("unavailable", "Terminal session is closed");
    const epoch = ++this.#epoch;
    let bootstrap: FrameMessage | undefined;
    let resolved = false;
    const receive = (message: TerminalMessage) => {
      if (epoch !== this.#epoch || this.#closed) return;
      if (message.type === "frame" && !resolved) {
        bootstrap = message.payload;
        return;
      }
      this.#receive(message);
    };
    const attachment = await this.#call(
      () => this.transport.attach(this.id, receive),
      epoch,
    );
    if (epoch !== this.#epoch || this.#closed) {
      await this.transport
        .detach(this.id, attachment.subscriptionId)
        .catch(() => {});
      return;
    }
    this.#attachment = attachment;
    this.#state.grid = new TerminalGrid(attachment.viewport);
    this.#state.attached = true;
    resolved = true;
    if (bootstrap) this.#receive({ type: "frame", payload: bootstrap });
    this.#changed();
  }
  #receive(message: TerminalMessage) {
    if (message.type === "frame") {
      const frame = message.payload;
      if (frame.subscriptionId !== this.#attachment?.subscriptionId) return;
      if (this.#state.grid?.apply(frame))
        this.#state.paste = frame.bracketedPaste;
      // Even overtaken viewports must release their exact in-flight credit.
      void this.#call(() =>
        this.transport.ack(this.id, frame.subscriptionId, frame.sequence),
      ).catch(() => {});
    } else if (message.type === "title") {
      this.#state.info = { ...this.#state.info, title: message.payload };
    } else if (message.type === "resetTitle") {
      this.#state.info = { ...this.#state.info, title: "Shell" };
    } else if (message.type === "exit") {
      this.#state.info = { ...this.#state.info, exited: true };
    } else if (message.type === "bell") this.options.onBell?.(this.id);
    this.#changed();
  }
  async detach(): Promise<void> {
    ++this.#epoch;
    this.#pending = undefined;
    this.#desired = undefined;
    const attachment = this.#attachment;
    this.#attachment = undefined;
    this.#state.attached = false;
    this.#changed();
    if (attachment)
      await this.transport
        .detach(this.id, attachment.subscriptionId)
        .catch(() => {});
  }
  input(data: string) {
    return this.#call(() => this.transport.input(this.id, data));
  }
  scroll(lines: number) {
    return this.#call(() => this.transport.scroll(this.id, lines));
  }
  focus(focused: boolean) {
    return this.#call(() => this.transport.focus(this.id, focused));
  }
  resize(columns: number, rows: number): Promise<void> {
    if (!this.#attachment || this.#closed) return Promise.resolve();
    if (this.#desired?.[0] === columns && this.#desired[1] === rows)
      return this.#resizing ?? Promise.resolve();
    this.#desired = [columns, rows];
    const current = this.#state.grid?.viewport;
    if (
      !this.#resizing &&
      current?.columns === columns &&
      current.screenLines === rows
    )
      return Promise.resolve();
    this.#pending = [columns, rows];
    const epoch = this.#epoch;
    if (this.#resizing && this.#resizeEpoch === epoch) return this.#resizing;
    const previous = this.#resizing;
    this.#resizeEpoch = epoch;
    const next = this.#call(async () => {
      // Keep backend resizes ordered even when a component unmounts/remounts.
      await previous?.catch(() => {});
      while (this.#pending && this.#attachment && epoch === this.#epoch) {
        const dimensions = this.#pending;
        this.#pending = undefined;
        const viewport = await this.transport.resize(this.id, ...dimensions);
        if (epoch !== this.#epoch || !this.#attachment) return;
        const current = this.#state.grid?.viewport;
        if (
          current?.generation !== viewport.generation ||
          current.columns !== viewport.columns ||
          current.screenLines !== viewport.screenLines
        ) {
          this.#state.grid?.resize(viewport);
          this.#changed();
        }
        await this.transport.ready(
          this.id,
          this.#attachment.subscriptionId,
          viewport,
        );
      }
    }, epoch)
      .catch((error) => {
        if (epoch === this.#epoch) this.#desired = undefined;
        throw error;
      })
      .finally(() => {
        if (this.#resizing === next) this.#resizing = undefined;
      });
    this.#resizing = next;
    return next;
  }
  async close(): Promise<void> {
    this.#closed = true;
    await this.detach();
    try {
      await this.transport.close(this.id);
    } catch (cause) {
      const error = TerminalError.from(cause);
      this.options.onError?.(error, this.id);
      throw error;
    }
    this.#state.info = { ...this.#state.info, exited: true };
    this.#changed();
  }
}
