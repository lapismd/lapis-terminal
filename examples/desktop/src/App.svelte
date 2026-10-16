<script lang="ts">
  import { nativeSmoke } from "./native-smoke.js";
  import Workbench from "./Workbench.svelte";
  import { createTauriTerminalClient } from "@lapismd/terminal/tauri";
  let notice = $state("");
  const client = createTauriTerminalClient({
    onError: (error) => (notice = error.message),
  });
</script>

<Workbench
  {client}
  onReady={(sessions) => void nativeSmoke(client, sessions)}
/>
{#if notice}<aside class="demo-toast" role="alert">
    {notice}<button onclick={() => (notice = "")}>Dismiss</button>
  </aside>{/if}
