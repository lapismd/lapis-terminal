<script lang="ts">
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { PanelToggle } from "@lapismd/design-core/shadcn/panel-toggle";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import type { TerminalSession } from "@lapismd/terminal";
  import NoteDocument from "./NoteDocument.svelte";
  import TerminalView from "./TerminalView.svelte";

  let { session, dark }: { session: TerminalSession; dark: boolean } = $props();
  const controller = new AppShellController({
    leftWidth: 230,
    rightClosed: true,
  });
  let main = $state<HTMLElement | null>(null);
  let selected = $state("README.md");
  let visible = $state(true);
  let maximized = $state(false);
  const compact = $derived(
    controller.mobile.resolvedMode === "desktop" &&
      controller.left.collapsed &&
      !controller.left.previewed,
  );
</script>

<div class="shell-app-example">
  <AppShell.Topbar mainElement={main} aria-label="Application rail">
    {#snippet leading()}<span class="shell-brand"
        ><WorkspaceIcon name="layers" />JJ Store</span
      >{/snippet}
    {#snippet center()}<span class="shell-location"
        >lapis-terminal <span>/ main</span></span
      >{/snippet}
    {#snippet trailing()}
      <span class="shell-caption">Local workspace</span>
      <PanelToggle
        side="bottom"
        iconVariant="standard"
        expanded={visible}
        size="icon-sm"
        aria-label={visible ? "Hide terminal" : "Show terminal"}
        title={visible ? "Hide terminal" : "Show terminal"}
        onclick={() => (visible = !visible)}
      />
    {/snippet}
  </AppShell.Topbar>
  <div class="shell-app-stage">
    <AppShell.Root {controller} mobileBreakpoint={760}>
      <AppShell.Sidebar side="left" label="Project files">
        <AppShell.Sidebar.Header class="shell-sidebar-header"
          ><span class="shell-brand"
            ><WorkspaceIcon
              name="folder-open"
            />{#if !compact}lapis-terminal{/if}</span
          ></AppShell.Sidebar.Header
        >
        <AppShell.Sidebar.Body>
          <nav
            class="shell-file-list shell-repository-files"
            class:compact
            aria-label="Repository files"
          >
            {#each ["README.md", "Cargo.toml", "package.json"] as file}
              <Button
                variant="ghost"
                aria-label={file}
                aria-pressed={selected === file}
                onclick={() => (selected = file)}
              >
                <WorkspaceIcon
                  name={file === "README.md" ? "file-text" : "file-code"}
                />
                {#if !compact}<span>{file}</span>{/if}
              </Button>
            {/each}
          </nav>
        </AppShell.Sidebar.Body>
        <AppShell.Sidebar.Footer class="shell-sidebar-footer"
          ><span class="shell-brand"
            ><WorkspaceIcon name="git-branch" />{#if !compact}main{/if}</span
          ></AppShell.Sidebar.Footer
        >
      </AppShell.Sidebar>
      <AppShell.Main bind:ref={main}>
        <AppShell.Toolbar>
          <div class="shell-toolbar">
            <AppShell.Sidebar.Toggle side="left" sidebarName="files" />
            <span class="shell-location">{selected}</span><span
              class="shell-spacer"
            ></span>
          </div>
        </AppShell.Toolbar>
        {#if !visible || !maximized}<AppShell.Body label="Repository document"
            ><NoteDocument title={selected} /></AppShell.Body
          >{/if}
        {#if visible}
          <section
            class="shell-terminal-dock"
            class:expanded={maximized}
            aria-label="Terminal dock"
          >
            <div class="shell-toolbar shell-dock-toolbar">
              <WorkspaceIcon name="terminal" /><strong>Terminal</strong><span
                class="shell-caption">lapis-terminal</span
              ><span class="shell-spacer"></span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={maximized
                  ? "Restore terminal"
                  : "Maximize terminal"}
                onclick={() => (maximized = !maximized)}
                ><WorkspaceIcon
                  name={maximized ? "minimize-2" : "maximize-2"}
                /></Button
              >
              <PanelToggle
                side="bottom"
                iconVariant="standard"
                expanded={visible}
                size="icon-sm"
                aria-label="Close terminal panel"
                onclick={() => (visible = false)}
              />
            </div>
            <TerminalView {session} {dark} />
          </section>
        {/if}
      </AppShell.Main>
    </AppShell.Root>
  </div>
  <footer class="shell-status">
    <span>main</span><span>1 terminal session</span><span class="shell-spacer"
    ></span><span>App Shell example · fixture data</span>
  </footer>
</div>
