import type {
  Attachment,
  OpenOptions,
  SessionInfo,
  TerminalMessage,
  TerminalTransport,
} from "../protocol.js";
import type { TerminalViewport } from "../renderer.js";
import { fixtureFrame } from "./frame.js";
export { fixtureFrame } from "./frame.js";
type Entry = {
  info: SessionInfo;
  lines: string[];
  viewport: TerminalViewport;
  sequence: number;
  subscription?: string;
  receive?: (message: TerminalMessage) => void;
};
/** Story/test transport: no processes, native APIs, filesystem or network. */
export class FixtureTransport implements TerminalTransport {
  readonly inputs: string[] = [];
  readonly closed: string[] = [];
  #sessions = new Map<string, Entry>();
  #serial = 0;
  constructor(
    private initial = ["Lapis Terminal", "Unicode: café 你好 👩🏽‍💻", "$ ready"],
  ) {}
  async targets() {
    return [{ id: "demo", label: "Example workspace" }];
  }
  async list() {
    return [...this.#sessions.values()].map((v) => v.info);
  }
  async open(options: OpenOptions) {
    if (this.closed.includes(options.requestId))
      throw new Error("Session was closed");
    const prior = this.#sessions.get(options.requestId);
    if (prior) {
      if (prior.info.target.id !== options.targetId)
        throw new Error("Conflicting open identity");
      return prior.info;
    }
    if (options.targetId !== "demo") throw new Error("Unknown target");
    const info = {
      id: options.requestId,
      target: { id: "demo", label: "Example workspace" },
      title: "Shell",
      exited: false,
    };
    this.#sessions.set(info.id, {
      info,
      lines: [...this.initial],
      viewport: {
        generation: 0,
        columns: options.columns ?? 80,
        screenLines: options.rows ?? 24,
      },
      sequence: 0,
    });
    return info;
  }
  #get(id: string) {
    const entry = this.#sessions.get(id);
    if (!entry) throw new Error("Session unavailable");
    return entry;
  }
  #publish(entry: Entry) {
    if (entry.receive && entry.subscription)
      entry.receive({
        type: "frame",
        payload: fixtureFrame(
          entry.lines,
          entry.viewport,
          entry.subscription,
          ++entry.sequence,
        ),
      });
  }
  async attach(
    id: string,
    receive: (message: TerminalMessage) => void,
  ): Promise<Attachment> {
    const entry = this.#get(id);
    entry.subscription = `fixture-${++this.#serial}`;
    entry.receive = receive;
    this.#publish(entry); // Deliberately arrives before the attach response.
    return {
      sessionId: id,
      subscriptionId: entry.subscription,
      viewport: entry.viewport,
    };
  }
  async detach(id: string, subscription: string) {
    const entry = this.#get(id);
    if (entry.subscription === subscription) {
      entry.receive = undefined;
      entry.subscription = undefined;
    }
  }
  async input(id: string, data: string) {
    const entry = this.#get(id);
    if (entry.info.exited) throw new Error("Session exited");
    this.inputs.push(data);
    entry.lines.push(data.replaceAll("\r", "↵"));
    if (entry.lines.length > 200) entry.lines.shift();
    this.#publish(entry);
  }
  async resize(id: string, columns: number, rows: number) {
    const entry = this.#get(id);
    if (
      columns !== entry.viewport.columns ||
      rows !== entry.viewport.screenLines
    )
      entry.viewport = {
        generation: entry.viewport.generation + 1,
        columns,
        screenLines: rows,
      };
    return entry.viewport;
  }
  async ready(id: string, subscription: string, viewport: TerminalViewport) {
    const entry = this.#get(id);
    if (
      entry.subscription === subscription &&
      entry.viewport.generation === viewport.generation
    )
      this.#publish(entry);
  }
  async ack(_id: string, _subscription: string, _sequence: number) {}
  async scroll(_id: string, _lines: number) {}
  async focus(_id: string, _focused: boolean) {}
  async close(id: string) {
    this.closed.push(id);
    this.#sessions.delete(id);
  }
  exit(id: string) {
    const entry = this.#get(id);
    entry.info.exited = true;
    entry.receive?.({ type: "exit" });
  }
  output(id: string, lines: string[]) {
    const entry = this.#get(id);
    entry.lines = lines.slice(-200);
    this.#publish(entry);
  }
}
