<script lang="ts">
  import { TerminalViewport } from "@lapismd/terminal/svelte";
  import { terminalPalette, type TerminalSession } from "@lapismd/terminal";
  let { session, dark = false }: { session: TerminalSession; dark?: boolean } =
    $props();
</script>

<div class="shell-terminal-view" data-session-id={session.id}>
  <TerminalViewport
    {session}
    palette={terminalPalette(dark)}
    label="Project terminal"
  />
</div>
