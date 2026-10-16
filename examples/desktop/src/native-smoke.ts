import { invoke } from "@tauri-apps/api/core";
import type { TerminalClient, TerminalSession } from "@lapismd/terminal";
declare global {
  interface Window {
    __LAPIS_TERMINAL_SMOKE__?: boolean;
  }
}
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function until<T>(get: () => T | undefined, message: string): Promise<T> {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const result = get();
    if (result !== undefined) return result;
    await delay(20);
  }
  throw new Error(message);
}
function button(text: string) {
  const value = [...document.querySelectorAll("button")].find(
    (v) => v.textContent?.trim() === text,
  );
  if (!value) throw new Error(`Missing button: ${text}`);
  value.click();
}
export async function nativeSmoke(
  client: TerminalClient,
  sessions: TerminalSession[],
) {
  if (!window.__LAPIS_TERMINAL_SMOKE__) return;
  const key = "lapis-terminal-smoke";
  const prior = sessionStorage.getItem(key);
  const pids: number[] = prior ? JSON.parse(prior).pids : [];
  try {
    const session = sessions[0];
    await until(
      () => (session.snapshot.attached ? true : undefined),
      "viewport failed to attach",
    );
    if (!prior) {
      const nonce = crypto.randomUUID().slice(0, 8);
      await session.input(
        `printf '\\nLAPIS_%s:%s:%s\\n' '${nonce}' "$$" "$PWD"\r`,
      );
      const match = await until(
        () =>
          session.snapshot.grid
            ?.text()
            .match(new RegExp(`LAPIS_${nonce}:(\\d+):(/[^\\n]+)`)) ?? undefined,
        "missing real shell output/cwd",
      );
      pids.push(Number(match[1]));
      await session.input(
        `/bin/sleep 60 & printf '\\nJOB_%s:%s\\n' '${nonce}' $!\r`,
      );
      const job = await until(
        () =>
          session.snapshot.grid
            ?.text()
            .match(new RegExp(`JOB_${nonce}:(\\d+)`)) ?? undefined,
        "missing background job",
      );
      pids.push(Number(job[1]));
      await invoke("smoke_control", { action: "progress", report: { pids } });
      const canvas = document.querySelector("canvas");
      if (!canvas || canvas.width < 100)
        throw new Error("viewport canvas did not render");
      button("Hide terminals");
      await until(
        () => (!document.querySelector("canvas") ? true : undefined),
        "hide did not detach",
      );
      button("Show terminals");
      await until(
        () => (session.snapshot.attached ? true : undefined),
        "show did not reattach",
      );
      if ((await client.list()).length !== 1)
        throw new Error("hide/show created another shell");
      button("Workspace panes");
      await delay(80);
      const input = document.querySelector("textarea")!;
      input.value = `printf '\\n%s_%s\\n' UNICODE '你好'\r`;
      input.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText" }),
      );
      await until(
        () =>
          session.snapshot.grid?.text().includes("UNICODE_你好")
            ? true
            : undefined,
        "WebView keyboard input failed",
      );
      await invoke("smoke_control", { action: "cancel-exit", report: {} });
      await until(asyncStatus, "cancelled exit was not observed");
      if ((await client.list()).length !== 1)
        throw new Error("cancelled exit killed the session");
      sessionStorage.setItem(
        key,
        JSON.stringify({ pids, id: session.id, marker: `LAPIS_${nonce}` }),
      );
      location.reload();
      return;
    }
    const saved = JSON.parse(prior);
    if (session.id !== saved.id)
      throw new Error("reload created a different session");
    await until(
      () =>
        session.snapshot.grid?.text().includes(saved.marker) ? true : undefined,
      "reload lost retained output",
    );
    await session.input("printf '\\nAFTER_%s:%s\\n' RELOAD \"$$\"\r");
    await until(
      () =>
        session.snapshot.grid?.text().includes(`AFTER_RELOAD:${pids[0]}`)
          ? true
          : undefined,
      "reload changed shell PID",
    );
    await session.close();
    if ((await client.list()).length)
      throw new Error("explicit close retained session");
    const enabled = await client.open({
      targetId: "demo",
      requestId: crypto.randomUUID(),
    });
    await enabled.attach();
    await invoke("smoke_control", { action: "disable", report: {} });
    let denied = false;
    try {
      await client.list();
    } catch {
      denied = true;
    }
    if (!denied) throw new Error("disabled host admitted a command");
    await invoke("smoke_control", { action: "enable", report: {} });
    if ((await client.list()).length)
      throw new Error("enable resurrected sessions");
    const quit = await client.open({
      targetId: "demo",
      requestId: crypto.randomUUID(),
    });
    await quit.attach();
    await quit.input("printf '\\nQUIT_%s:%s\\n' PID \"$$\"\r");
    const match = await until(
      () => quit.snapshot.grid?.text().match(/QUIT_PID:(\d+)/) ?? undefined,
      "missing quit PID",
    );
    pids.push(Number(match[1]));
    sessionStorage.removeItem(key);
    await invoke("smoke_control", {
      action: "report",
      report: {
        ok: true,
        pids,
        checks: [
          "PTY cwd/output",
          "canvas",
          "hide/show",
          "workspace panes",
          "Unicode input",
          "cancelled exit",
          "reload same PID",
          "close",
          "disable/enable",
          "quit cleanup",
        ],
      },
    });
  } catch (error) {
    sessionStorage.removeItem(key);
    await invoke("smoke_control", {
      action: "report",
      report: {
        ok: false,
        pids,
        error: String(error),
        output: sessions[0]?.snapshot.grid?.text(),
      },
    });
  }
}
let cancelled = false;
function asyncStatus() {
  void invoke<boolean>("smoke_cancelled").then((value) => (cancelled = value));
  return cancelled ? true : undefined;
}
