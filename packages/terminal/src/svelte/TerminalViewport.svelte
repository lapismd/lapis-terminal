<script lang="ts">
  import { untrack } from "svelte";
  import type { TerminalSession, SessionSnapshot } from "../controller.js";
  import { TERMINAL_CELL_METRICS, type CellMetrics } from "../renderer.js";
  import { terminalPalette, type TerminalPalette } from "../palette.js";
  import {
    encodeTerminalKey,
    encodePaste,
    accumulateScrollLines,
  } from "../keyboard.js";
  import { copyTerminalSelection } from "../selection.js";
  import "./viewport.css";
  let {
    session,
    palette = terminalPalette(),
    metrics = TERMINAL_CELL_METRICS,
    label = "Terminal",
    class: className = "",
    style = "",
    interceptKey = () => false,
  }: {
    session: TerminalSession;
    palette?: TerminalPalette;
    metrics?: CellMetrics;
    label?: string;
    class?: string;
    style?: string;
    interceptKey?: (event: KeyboardEvent) => boolean;
  } = $props();
  const helpId = $props.id();
  let state = $state<SessionSnapshot>(untrack(() => session.snapshot));
  let root: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let input: HTMLTextAreaElement;
  let composition = false;
  let remainder = { remainderPx: 0 };
  const ignore = () => {};
  let rows = $derived.by(() => {
    state.revision;
    return state.grid?.selectionRows() ?? [];
  });
  export function focus() {
    input?.focus({ preventScroll: true });
  }
  function paint() {
    if (!root || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = root.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = palette.background;
    context.fillRect(0, 0, rect.width, rect.height);
    state.grid?.markAllDirty();
    state.grid?.paint(context, metrics, palette);
  }
  function resize() {
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    void session
      .resize(
        Math.max(2, Math.min(512, Math.floor(rect.width / metrics.width))),
        Math.max(1, Math.min(200, Math.floor(rect.height / metrics.height))),
      )
      .catch(ignore);
  }
  $effect(() => {
    const current = session;
    const unsubscribe = current.subscribe((value) => (state = value));
    void current.attach().catch(ignore);
    return () => {
      unsubscribe();
      void current.detach();
    };
  });
  $effect(() => {
    state.revision;
    palette;
    metrics;
    paint();
  });
  $effect(() => {
    if (state.attached) {
      metrics;
      resize();
    }
  });
  $effect(() => {
    if (!root) return;
    const element = root;
    const copy = (event: ClipboardEvent) =>
      copyTerminalSelection(event, state.grid, element);
    document.addEventListener("copy", copy);
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      paint();
      clearTimeout(timer);
      timer = setTimeout(resize, 60);
    });
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("copy", copy);
    };
  });
  function send(data: string) {
    if (data && !state.info.exited) void session.input(data).catch(ignore);
  }
  function key(event: KeyboardEvent) {
    if (event.isComposing || composition || interceptKey(event)) return;
    const encoded = encodeTerminalKey(event);
    if (encoded) {
      event.preventDefault();
      event.stopPropagation();
      send(encoded);
    }
  }
</script>

<div
  bind:this={root}
  class="lt-viewport {className}"
  style="--lt-row-height: {metrics.height}px; --lt-font: {metrics.font}; background: {palette.background}; color: {palette.foreground}; {style}"
  onwheel={(event) => {
    event.preventDefault();
    const pixels =
      event.deltaMode === 1
        ? event.deltaY * metrics.height
        : event.deltaMode === 2
          ? event.deltaY * root.clientHeight
          : event.deltaY;
    const next = accumulateScrollLines(remainder, pixels, metrics.height);
    remainder = next.state;
    if (next.lines) void session.scroll(next.lines).catch(ignore);
  }}
>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <div
    class="lt-selection"
    aria-hidden="true"
    onpointerup={() => {
      if (window.getSelection()?.isCollapsed !== false) focus();
    }}
  >
    {#each rows as row (row.line)}<div data-terminal-row={row.line}>
        {row.text || "\u00a0"}
      </div>{/each}
  </div>
  <textarea
    bind:this={input}
    aria-label="{label} input"
    aria-describedby={helpId}
    disabled={state.info.exited || !state.attached}
    autocomplete="off"
    autocapitalize="off"
    spellcheck={false}
    onkeydown={key}
    oncompositionstart={() => (composition = true)}
    oncompositionend={(event) => {
      composition = false;
      send(event.currentTarget.value);
      event.currentTarget.value = "";
    }}
    oninput={(event) => {
      if (composition || (event instanceof InputEvent && event.isComposing))
        return;
      send(event.currentTarget.value);
      event.currentTarget.value = "";
    }}
    onpaste={(event) => {
      event.preventDefault();
      send(
        encodePaste(
          event.clipboardData?.getData("text/plain") ?? "",
          state.paste,
        ),
      );
    }}
    onfocus={() => void session.focus(true).catch(ignore)}
    onblur={() => {
      composition = false;
      void session.focus(false).catch(ignore);
    }}
  ></textarea>
  <span id={helpId} class="lt-sr"
    >Type commands here. Terminal output is available in the following text
    region.</span
  >
  <div
    role="textbox"
    aria-readonly="true"
    aria-multiline="true"
    aria-label="{label} output"
    tabindex="0"
    class="lt-sr"
  >
    {rows.map((row) => row.text).join("\n")}
  </div>
</div>
