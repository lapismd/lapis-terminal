<script lang="ts">
  import { onMount } from "svelte";
  import {
    createTerminalClient,
    type TerminalSession,
  } from "@lapismd/terminal";
  import { FixtureTransport } from "@lapismd/terminal/testing";
  import AppShellExample from "./AppShellExample.svelte";
  import WorkspaceExample from "./WorkspaceExample.svelte";
  import "./shells.css";

  let {
    kind = "app-shell",
    dark = false,
  }: {
    kind?: "app-shell" | "workspace";
    dark?: boolean;
  } = $props();
  let session = $state<TerminalSession>();
  let notice = $state("");
  const transport = new FixtureTransport([
    "~/projects/lapis-terminal",
    "$ pnpm test",
    "✓ terminal sessions · viewport · keyboard",
    "10 tests passed",
    "",
    "$ ready",
  ]);
  const client = createTerminalClient(transport, {
    onError: (error) => (notice = error.message),
  });
  onMount(() => {
    let disposed = false;
    void client
      .open({ targetId: "demo", requestId: crypto.randomUUID() })
      .then(async (opened) => {
        if (disposed) await opened.close();
        else session = opened;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      void session?.close().catch(() => {});
    };
  });
</script>

<div
  class="shell-review"
  class:dark
  data-ui-theme="lapis"
  data-shell-example={kind}
>
  {#if session}
    {#if kind === "app-shell"}
      <AppShellExample {session} {dark} />
    {:else}
      <WorkspaceExample {session} {dark} />
    {/if}
  {/if}
  {#if notice}
    <aside class="shell-notice" role="alert">
      {notice}<button onclick={() => (notice = "")}>Dismiss</button>
    </aside>
  {/if}
</div>
