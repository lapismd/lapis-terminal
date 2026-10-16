<script lang="ts">
  import { untrack } from "svelte";
  import Workbench from "../examples/desktop/src/Workbench.svelte";
  import {
    createTerminalClient,
    type TerminalSession,
  } from "@lapismd/terminal";
  import { FixtureTransport } from "@lapismd/terminal/testing";
  let {
    layout = "dock",
    dark = true,
    compact = false,
    scenario = "normal",
  }: {
    layout?: "dock" | "panes" | "bare";
    dark?: boolean;
    compact?: boolean;
    scenario?: "normal" | "exited" | "high-output" | "error" | "input";
  } = $props();
  const transport = new FixtureTransport();
  let notice = $state("");
  let inputs = $state<string[]>([]);
  const originalInput = transport.input.bind(transport);
  transport.input = async (id, data) => {
    await originalInput(id, data);
    inputs = [...transport.inputs];
  };
  const client = createTerminalClient(transport, {
    onError: (e) => (notice = e.message),
  });
  async function ready(sessions: TerminalSession[]) {
    const first = sessions[0];
    if (scenario === "high-output")
      transport.output(
        first.id,
        Array.from(
          { length: 100 },
          (_, i) => `build step ${i + 1}: ✓ complete`,
        ),
      );
    if (scenario === "exited") {
      await first.attach();
      transport.exit(first.id);
    }
    if (scenario === "error") {
      transport.input = async () => {
        throw new Error("Fixture input is temporarily unavailable");
      };
    }
  }
</script>

<Workbench {client} {layout} {dark} {compact} onReady={ready} />
{#if notice}<aside class="demo-toast" role="alert">
    {notice}<button onclick={() => (notice = "")}>Dismiss</button>
  </aside>{/if}

{#if scenario === "input"}<output aria-label="Sent input"
    >{JSON.stringify(inputs)}</output
  >{/if}
