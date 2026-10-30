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
    qmd: "LTERM-GOV-100",
  },
  validators: {
    qmd: { collection: "lapis-terminal-spec" },
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
        "^\\.changeset/",
        "^(?:crates/|packages/|examples/|catalog/|\\.storybook/|scripts/|Cargo|rust|package|pnpm|AGENTS|README|docs/|spec-validator|\\.github/)",
      ],
      rules: [
        {
          pattern:
            "^(?:\\.changeset/|(?:package\\.json|pnpm-lock\\.yaml|Cargo\\.(?:toml|lock))$|crates/[^/]+/Cargo\\.toml$|packages/terminal/(?:package\\.json|CHANGELOG\\.md)$|examples/desktop/(?:package\\.json|CHANGELOG\\.md|src-tauri/(?:Cargo\\.toml|tauri\\.conf\\.json))$)",
          chapters: ["spec/src/current/contracts/release.md"],
        },
        {
          pattern: "^crates/lapis-terminal-engine/(?!Cargo\\.toml$)",
          chapters: ["spec/src/current/contracts/engine.md"],
        },
        {
          pattern: "^crates/lapis-terminal-runtime/(?!Cargo\\.toml$)",
          chapters: [
            "spec/src/current/contracts/runtime.md",
            "spec/src/current/contracts/flow.md",
            "spec/src/current/contracts/host.md",
          ],
        },
        {
          pattern:
            "^(?:crates/tauri-plugin-[^/]+/(?!Cargo\\.toml$)|examples/(?!desktop/(?:package\\.json|CHANGELOG\\.md|src-tauri/(?:Cargo\\.toml|tauri\\.conf\\.json))$)|packages/terminal/src/tauri/)",
          chapters: ["spec/src/current/contracts/tauri.md"],
        },
        {
          pattern: "^packages/(?!terminal/(?:package\\.json|CHANGELOG\\.md)$)",
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
            "^(?!(?:package\\.json|pnpm-lock\\.yaml|Cargo\\.(?:toml|lock))$)(?:scripts/|Cargo|rust|package(?!s/)|pnpm|AGENTS|README|docs/|spec-validator|\\.github/)",
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
      { name: "release", command: "pnpm", args: ["release:check"] },
    ],
  },
});

export default config;
