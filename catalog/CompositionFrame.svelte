<script lang="ts">
  import { onMount } from "svelte";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { PanelToggle } from "@lapismd/design-core/shadcn/panel-toggle";
  import { TerminalViewport } from "@lapismd/terminal/svelte";
  import {
    terminalPalette,
    type TerminalClient,
    type TerminalSession,
    type TerminalTarget,
  } from "@lapismd/terminal";
  import "./compositions.css";

  let {
    client,
    layout = "dock",
    dark = false,
    compact = false,
    onReady = () => {},
  }: {
    client: TerminalClient;
    layout?: "dock" | "panes" | "bare";
    dark?: boolean;
    compact?: boolean;
    onReady?: (sessions: TerminalSession[]) => void | Promise<void>;
  } = $props();
  const controller = new AppShellController({
    leftClosed: true,
    rightClosed: true,
  });
  let sessions = $state<TerminalSession[]>([]);
  let targets = $state<TerminalTarget[]>([]);
  let target = $state("");
  let active = $state("");
  let hidden = $state(false);
  let maximized = $state(false);
  let height = $state(300);
  let pending = $state(false);
  let disposed = false;

  async function add() {
    if (!target || pending || disposed) return;
    pending = true;
    try {
      const session = await client.open({
        targetId: target,
        requestId: crypto.randomUUID(),
      });
      if (disposed) {
        await session.close();
        return;
      }
      sessions = [...sessions, session];
      active = session.id;
      hidden = false;
    } catch {
      // The fixture host reports the client error.
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
      // The fixture host reports the client error.
    }
  }
  onMount(() => {
    void (async () => {
      try {
        targets = await client.targets();
        if (disposed) return;
        target = targets[0]?.id ?? "";
        await add();
        if (!disposed) await onReady(sessions);
      } catch {
        // The fixture host reports the client error.
      }
    })();
    return () => {
      disposed = true;
      for (const session of sessions) void session.close().catch(() => {});
    };
  });
</script>

<div class="composition-shell" class:dark class:compact data-ui-theme="lapis">
  <AppShell.Root {controller} displayMode="desktop">
    <AppShell.Main>
      <AppShell.Toolbar label="Terminal actions">
        <div class="composition-header">
          <div class="composition-actions">
            <strong>Terminal</strong>
            <span class="composition-caption"
              >{sessions.length}
              {sessions.length === 1 ? "session" : "sessions"}</span
            >
            <span class="composition-spacer"></span>
            <Button
              variant="ghost"
              size="sm"
              onclick={add}
              disabled={pending || !target}>New terminal</Button
            >
            {#if layout === "dock"}
              <Button
                variant="ghost"
                size="sm"
                onclick={() => (maximized = !maximized)}
                >{maximized ? "Restore" : "Maximize"}</Button
              >
            {/if}
            <PanelToggle
              side="bottom"
              iconVariant="standard"
              expanded={!hidden}
              size="icon-sm"
              aria-label={hidden ? "Show terminals" : "Hide terminals"}
              onclick={() => (hidden = !hidden)}
            />
          </div>
          <div class="composition-actions composition-options">
            <label
              >Target <select bind:value={target}
                >{#each targets as item}<option value={item.id}
                    >{item.label}</option
                  >{/each}</select
              ></label
            >
            {#if layout !== "bare"}
              <label
                >Panel height <input
                  aria-label="Panel height"
                  type="range"
                  min="180"
                  max="520"
                  step="10"
                  bind:value={height}
                /></label
              >
            {/if}
            <span class="composition-spacer"></span>
            {#each sessions as session, index (session.id)}
              <div class="composition-session">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={active === session.id}
                  onclick={() => (active = session.id)}
                  >Shell {index + 1}</Button
                >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close shell {index + 1}"
                  onclick={() => close(session)}>×</Button
                >
              </div>
            {/each}
          </div>
        </div>
      </AppShell.Toolbar>
      <AppShell.Body label="Terminal example" layout="regions">
        <div class="composition-body">
          {#if hidden}
            <p class="composition-caption">
              Sessions remain running. Show terminals to reconnect.
            </p>
          {:else}
            <div
              class="composition-views"
              class:split={layout === "panes"}
              style:height={layout === "bare" || maximized
                ? "100%"
                : `${height}px`}
            >
              {#each sessions as session, index (session.id)}
                {#if layout === "panes" || active === session.id}
                  <section
                    class="composition-pane"
                    aria-label="Shell {index + 1} pane"
                    data-session-id={session.id}
                  >
                    <TerminalViewport
                      {session}
                      palette={terminalPalette(dark)}
                      label="Shell {index + 1}"
                    />
                  </section>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </AppShell.Body>
    </AppShell.Main>
  </AppShell.Root>
</div>
