import { mount, unmount } from "svelte";
import {
  AppShellController,
  WorkspaceView,
  createDefaultWorkspaceLayout,
  createWorkspaceTab,
  createWorkspaceTabs,
} from "@lapismd/design-core/workspace/core";
import type { TerminalSession } from "@lapismd/terminal";
import TerminalView from "./TerminalView.svelte";
import NoteDocument from "./NoteDocument.svelte";
import WorkspaceFiles from "./WorkspaceFiles.svelte";

/** Explicit host owns the session; registered views only mount/detach it. */
export function createWorkspaceExample(
  session: TerminalSession,
  dark: () => boolean,
) {
  class ExampleView extends WorkspaceView {
    #component?: ReturnType<typeof mount>;
    getViewType() {
      return this.leaf.viewState?.type ?? "note";
    }
    onOpen() {
      const type = this.getViewType();
      this.#component =
        type === "terminal"
          ? mount(TerminalView, {
              target: this.containerEl,
              props: {
                session,
                get dark() {
                  return dark();
                },
              },
            })
          : type === "files"
            ? mount(WorkspaceFiles, {
                target: this.containerEl,
                props: {
                  openNote: () => {
                    app.workspace.revealLeaf("development-note");
                  },
                },
              })
            : mount(NoteDocument, {
                target: this.containerEl,
                props: { title: this.leaf.title, note: true },
              });
    }
    async onClose() {
      if (this.#component) await unmount(this.#component);
      this.#component = undefined;
    }
  }
  const tab = (id: string, title: string, type: string, icon: string) =>
    createWorkspaceTab({ id, title, icon, view: { type, state: {} } });
  const note = tab("development-note", "Development", "note", "file-text");
  const terminal = tab(
    "project-terminal",
    "Terminal",
    "terminal",
    "square-terminal",
  );
  const layout = createDefaultWorkspaceLayout();
  layout.main = createWorkspaceTabs([note], {
    id: "notes-pane",
    activeItemId: note.id,
  });
  layout.bottom = {
    open: true,
    size: 290,
    root: createWorkspaceTabs(
      [terminal, tab("session-notes", "Session notes", "note", "notebook-pen")],
      { id: "terminal-panel", activeItemId: terminal.id },
    ),
  };
  layout.left = {
    open: false,
    size: 228,
    root: createWorkspaceTabs(
      [tab("vault-files", "Files", "files", "folder-open")],
      { id: "vault-sidebar" },
    ),
  };
  layout.right.open = false;
  layout.active = { hostId: "root", paneId: "notes-pane", tabId: note.id };
  const app = new AppShellController({
    layout,
    application: { name: "Lapis Notes", version: "Example", icon: "notebook" },
    views: ["terminal", "note", "files"].map((type) => ({
      type,
      factory: (leaf) => new ExampleView(leaf),
      options: { showHeader: false },
    })),
    configuration: { values: { "workspace.mobile.mode": "auto" } },
  });
  app.ribbon.addItem({
    id: "open-terminal",
    label: "Open terminal",
    icon: "square-terminal",
    section: "top",
    onSelect: () => {
      const existing = app.workspace.getLeavesOfType("terminal")[0];
      if (existing) app.workspace.revealLeaf(existing);
      else
        app.workspace.openInBottomPanel(
          "terminal",
          {},
          { title: "Terminal", icon: "square-terminal" },
        );
    },
  });
  app.status.addItem({
    id: "terminal-status",
    label: "1 terminal session",
    icon: "square-terminal",
    align: "left",
  });
  app.status.addItem({
    id: "fixture-status",
    label: "Workspace example · fixture data",
    align: "right",
  });
  return app;
}
