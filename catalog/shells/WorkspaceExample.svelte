<script lang="ts">
  import { untrack } from "svelte";
  import { AppShell } from "@lapismd/design-core/workspace/app-shell";
  import type { TerminalSession } from "@lapismd/terminal";
  import { createWorkspaceExample } from "./workspace-example.js";
  let { session, dark }: { session: TerminalSession; dark: boolean } = $props();
  const controller = untrack(() => createWorkspaceExample(session, () => dark));
</script>

<div class="shell-workspace-stage">
  <AppShell.Root {controller} theme="inherit" disposeOnDestroy>
    <AppShell.Surface
      workspaceLabel="Lapis Notes"
      bottomPanelAlignment="center"
    />
  </AppShell.Root>
</div>
