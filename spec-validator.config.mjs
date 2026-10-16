import {
  defineConfig,
  tableRequirements,
  singleIdVerification,
} from "@lapismd/spec-validator";
const config = defineConfig(tableRequirements(), {
  name: "lapis-terminal",
  idPattern: /^LTERM-[A-Z]+-\d{3}$/,
  tableSection: "Requirements",
  ruleIds: {
    fileLimits: "LTERM-GOV-101",
    summary: "LTERM-GOV-101",
    governance: "LTERM-GOV-100",
    verification: "LTERM-GOV-101",
    book: "LTERM-GOV-101",
    bookIgnore: "LTERM-GOV-101",
    specFirst: "LTERM-GOV-100",
    internal: "LTERM-GOV-100",
  },
  validators: {
    fileLimits: { maxLines: 400, maxBytes: 32768 },
    summary: true,
    governance: {
      extras: ["AGENTS.md", "README.md"],
      normative: true,
      proseLimits: false,
      acceptance: false,
      references: true,
      changeMap: false,
    },
    verification: {
      ...singleIdVerification({
        headers: {
          ids: ["ID"],
          status: ["Status"],
          evidence: ["Evidence"],
          required: [],
        },
        statuses: ["Implemented", "Planned"],
      }),
      files: ["^current/verification\\.md$"],
    },
    book: true,
    specFirst: {
      mode: "mapped",
      canonicalPattern: "^spec/src/current/(?:contracts/.+|governance)\\.md$",
      ignore: [
        "^spec/src/history/",
        "^spec/src/current/(?:verification|progress)/",
      ],
      protected: [
        "^(?:crates/|packages/|examples/|catalog/|\\.storybook/|scripts/|Cargo|rust|package|pnpm|AGENTS|README|docs/|spec-validator|\\.github/)",
      ],
      rules: [
        {
          pattern: "^crates/lapis-terminal-engine/",
          chapters: ["spec/src/current/contracts/engine.md"],
        },
        {
          pattern: "^crates/lapis-terminal-runtime/",
          chapters: [
            "spec/src/current/contracts/runtime.md",
            "spec/src/current/contracts/flow.md",
            "spec/src/current/contracts/host.md",
          ],
        },
        {
          pattern:
            "^(?:crates/tauri-plugin-|examples/|packages/terminal/src/tauri/)",
          chapters: ["spec/src/current/contracts/tauri.md"],
        },
        {
          pattern: "^packages/",
          chapters: [
            "spec/src/current/contracts/ui.md",
            "spec/src/current/contracts/package.md",
          ],
        },
        {
          pattern: "^(?:catalog/|\\.storybook/)",
          chapters: ["spec/src/current/contracts/catalog.md"],
        },
        {
          pattern:
            "^(?:scripts/|Cargo|rust|package|pnpm|AGENTS|README|docs/|spec-validator|\\.github/)",
          chapters: ["spec/src/current/governance.md"],
        },
      ],
    },
  },
  check: {
    first: true,
    build: true,
    lanes: [
      { name: "format", command: "pnpm", args: ["format:check"] },
      { name: "architecture", command: "pnpm", args: ["check:architecture"] },
      { name: "boundaries", command: "pnpm", args: ["check:boundaries"] },
      { name: "progress", command: "pnpm", args: ["check:progress"] },
    ],
  },
});

export default config;
