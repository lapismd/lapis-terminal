<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  let { openNote }: { openNote: () => void } = $props();
</script>

<nav class="shell-file-list" aria-label="Vault files">
  <p class="shell-kicker">PROJECT NOTES</p>
  <Button variant="ghost" onclick={openNote}
    ><WorkspaceIcon name="file-text" />Development.md</Button
  >
  <p class="shell-caption shell-file-hint">Notes above, terminal below.</p>
</nav>
