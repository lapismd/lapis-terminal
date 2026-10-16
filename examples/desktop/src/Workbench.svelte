<script lang="ts">
  import { onMount } from "svelte";
  import { TerminalViewport } from "@lapismd/terminal/svelte";
  import {
    terminalPalette,
    type TerminalClient,
    type TerminalSession,
    type TerminalTarget,
  } from "@lapismd/terminal";
  import "./workbench.css";
  let {
    client,
    layout = "dock",
    dark = true,
    compact = false,
    onReady = () => {},
  }: {
    client: TerminalClient;
    layout?: "dock" | "panes" | "bare";
    dark?: boolean;
    compact?: boolean;
    onReady?: (sessions: TerminalSession[]) => void;
  } = $props();
  let sessions = $state<TerminalSession[]>([]);
  let targets = $state<TerminalTarget[]>([]);
  let target = $state("");
  let active = $state("");
  let hidden = $state(false);
  let maximized = $state(false);
  let height = $state(300);
  let pending = $state(false);
  const palette = $derived(terminalPalette(dark));
  async function add() {
    if (!target || pending) return;
    pending = true;
    try {
      const session = await client.open({
        targetId: target,
        requestId: crypto.randomUUID(),
      });
      sessions = [...sessions, session];
      active = session.id;
      hidden = false;
    } catch {
      // The client reports failures to the application notification callback.
    } finally {
      pending = false;
    }
  }
  async function close(session: TerminalSession) {
    try {
      await session.close();
      sessions = sessions.filter((item) => item !== session);
      if (active === session.id) active = sessions[0]?.id ?? "";
    } catch {
      // The owner receives the typed client error.
    }
  }
  onMount(() => {
    let disposed = false;
    void (async () => {
      try {
        targets = await client.targets();
        if (disposed) return;
        target = targets[0]?.id ?? "";
        sessions = (await client.list()).map((info) => client.session(info));
        if (disposed) return;
        active = sessions[0]?.id ?? "";
        if (!sessions.length) await add();
        if (!disposed) onReady(sessions);
      } catch {
        // The client reports discovery errors to the owner.
      }
    })();
    return () => {
      disposed = true;
    };
  });
</script>

<main
  class:light={!dark}
  class:compact
  class="demo-shell"
  style="--demo-bg: {dark ? '#10161c' : '#fff'}; --demo-fg: {dark
    ? '#dce4ec'
    : '#17202b'}"
>
  {#if layout !== "bare"}
    <header>
      <div>
        <span class="demo-eyebrow">LAPIS TERMINAL</span>
        <h1>One terminal. Your workspace.</h1>
      </div>
      <button onclick={() => (dark = !dark)}
        >{dark ? "Light theme" : "Dark theme"}</button
      >
    </header>
    <nav aria-label="Example layout">
      <button aria-pressed={layout === "dock"} onclick={() => (layout = "dock")}
        >Bottom dock</button
      >
      <button
        aria-pressed={layout === "panes"}
        onclick={() => (layout = "panes")}>Workspace panes</button
      >
      <span class="demo-caption">Shared viewport · app-owned layout</span>
    </nav>
    {#if layout === "dock" && !maximized}<section class="demo-editor">
        <span class="demo-eyebrow">WORKSPACE / NOTES</span>
        <h2>A place for your work</h2>
        <p>
          The terminal can live below your editor, alongside a note, or inside a
          split pane. Its session stays alive when you rearrange the view.
        </p>
        <div class="demo-lines"></div>
      </section>{/if}
  {/if}
  <section
    class="demo-terminal"
    class:demo-max={maximized}
    aria-label="Terminal workspace"
  >
    {#if layout !== "bare"}
      <div class="demo-toolbar">
        <label class="demo-target"
          >Target <select bind:value={target}
            >{#each targets as item}<option value={item.id}>{item.label}</option
              >{/each}</select
          ></label
        >
        <button onclick={add} disabled={pending || !target}>New terminal</button
        >
        <div class="demo-spacer"></div>
        {#if layout === "dock"}<button onclick={() => (maximized = !maximized)}
            >{maximized ? "Restore" : "Maximize"}</button
          >{/if}
        <button onclick={() => (hidden = !hidden)}
          >{hidden ? "Show terminals" : "Hide terminals"}</button
        >
      </div>
    {/if}
    {#if !hidden}
      {#if layout === "dock"}
        <div class="demo-tabs" role="tablist" aria-label="Terminal sessions">
          {#each sessions as session, index (session.id)}<button
              role="tab"
              aria-selected={active === session.id}
              onclick={() => (active = session.id)}>Shell {index + 1}</button
            >{/each}
        </div>
      {/if}
      <div
        class="demo-views"
        class:split={layout === "panes"}
        style:height={layout === "bare"
          ? "100%"
          : maximized
            ? "520px"
            : `${height}px`}
      >
        {#each sessions as session, index (session.id)}
          {#if layout === "panes" || active === session.id}
            <section class="demo-pane" aria-label="Shell {index + 1} pane">
              {#if layout !== "bare"}<div class="demo-pane-title">
                  <span>Shell {index + 1}</span><button
                    aria-label="Close shell {index + 1}"
                    onclick={() => close(session)}>Close</button
                  >
                </div>{/if}
              <div class="demo-viewport">
                <TerminalViewport
                  {session}
                  {palette}
                  label="Shell {index + 1}"
                />
              </div>
            </section>
          {/if}
        {/each}
      </div>
    {:else}<p class="demo-hidden">
        Sessions remain running. Show terminals to reconnect.
      </p>{/if}
    {#if layout !== "bare"}<footer>
        <span
          >{sessions.length} active {sessions.length === 1
            ? "session"
            : "sessions"}</span
        ><label
          >Panel height <input
            aria-label="Panel height"
            type="range"
            min="180"
            max="520"
            step="10"
            bind:value={height}
          /></label
        >
      </footer>{/if}
  </section>
</main>
