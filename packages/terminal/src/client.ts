import { TerminalSession } from "./controller.js";
import { TerminalError } from "./protocol.js";
import type {
  ClientOptions,
  OpenOptions,
  SessionInfo,
  TerminalTransport,
} from "./protocol.js";
export class TerminalClient {
  constructor(
    readonly transport: TerminalTransport,
    readonly options: ClientOptions = {},
  ) {}
  targets() {
    return this.#call(() => this.transport.targets());
  }
  list() {
    return this.#call(() => this.transport.list());
  }
  session(info: SessionInfo) {
    return new TerminalSession(this.transport, info, this.options);
  }
  async #call<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (cause) {
      const error = TerminalError.from(cause);
      this.options.onError?.(error);
      throw error;
    }
  }
  async open(options: OpenOptions) {
    return this.session(await this.#call(() => this.transport.open(options)));
  }
}
export function createTerminalClient(
  transport: TerminalTransport,
  options?: ClientOptions,
) {
  return new TerminalClient(transport, options);
}
