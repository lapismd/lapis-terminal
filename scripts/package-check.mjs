import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { resolve } from "node:path";
import { checkRelease } from "./release-state.mjs";
const version = checkRelease();
const root = process.cwd();
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, stdio: "inherit" });
const write = (path, text) => writeFileSync(path, text);
const cargo = (args) => run("node", ["scripts/managed-cargo.mjs", ...args]);
mkdirSync(".local/packages", { recursive: true });
const crates = [
  "lapis-terminal-engine",
  "lapis-terminal-runtime",
  "tauri-plugin-lapis-terminal",
];
for (const name of crates) {
  const list = execFileSync(
    "node",
    [
      "scripts/managed-cargo.mjs",
      "package",
      "-p",
      name,
      "--list",
      "--allow-dirty",
      "--locked",
    ],
    { encoding: "utf8" },
  ).split("\n");
  for (const file of ["LICENSE.md", "NOTICE.md", "README.md", "Cargo.toml"])
    if (!list.includes(file)) throw new Error(`${name} omits ${file}`);
  if (list.some((file) => /^(?:target|node_modules|\.local)\//.test(file)))
    throw new Error(`${name}: generated/private package content`);
}
cargo([
  "package",
  "--workspace",
  "--exclude",
  "lapis-terminal-demo",
  "--allow-dirty",
  "--locked",
]);
const rust = mkdtempSync(resolve(".local/consumer-rust-"));
mkdirSync(`${rust}/src`);
const patches = crates
  .map(
    (name) =>
      `${name} = { path = ${JSON.stringify(resolve(`target/package/${name}-${version}`))} }`,
  )
  .join("\n");
write(
  `${rust}/Cargo.toml`,
  `[package]\nname = "terminal-package-consumer"\nversion = "0.0.0"\nedition = "2024"\n[workspace]\n[dependencies]\nlapis-terminal-runtime = "=${version}"\ntauri-plugin-lapis-terminal = "=${version}"\ntempfile = "3"\n[patch.crates-io]\n${patches}\n[profile.dev]\ndebug = 0\n`,
);
copyFileSync(
  `target/package/lapis-terminal-runtime-${version}/examples/basic.rs`,
  `${rust}/src/main.rs`,
);
cargo([
  "run",
  "--manifest-path",
  `${rust}/Cargo.toml`,
  "--target-dir",
  resolve("target"),
]);
run(
  "pnpm",
  ["pack", "--pack-destination", resolve(".local/packages")],
  resolve("packages/terminal"),
);
const tarball = readdirSync(".local/packages").find(
  (name) => name === `lapismd-terminal-${version}.tgz`,
);
if (!tarball) throw new Error("npm artifact missing");
const js = mkdtempSync(resolve(".local/consumer-js-"));
const deps = JSON.parse(readFileSync("package.json", "utf8")).devDependencies;
write(
  `${js}/package.json`,
  JSON.stringify(
    {
      name: "terminal-package-consumer",
      private: true,
      type: "module",
      packageManager: "pnpm@10.32.1",
      dependencies: {
        "@lapismd/terminal": `file:${resolve(".local/packages", tarball)}`,
        "@tauri-apps/api": deps["@tauri-apps/api"],
        svelte: deps.svelte,
      },
      devDependencies: {
        vite: deps.vite,
        "@sveltejs/vite-plugin-svelte": deps["@sveltejs/vite-plugin-svelte"],
      },
      pnpm: { onlyBuiltDependencies: ["esbuild"] },
    },
    null,
    2,
  ),
);
write(
  `${js}/vite.config.js`,
  `import { defineConfig } from 'vite';\nimport { svelte } from '@sveltejs/vite-plugin-svelte';\nexport default defineConfig({plugins:[svelte()]});\n`,
);
write(
  `${js}/index.html`,
  '<!doctype html><html lang="en"><title>Packaged terminal</title><body><div id="app"></div><script type="module" src="/main.js"></script></body></html>',
);
write(
  `${js}/main.js`,
  `import { mount } from 'svelte'; import App from './App.svelte'; mount(App, { target: document.querySelector('#app') });\n`,
);
write(
  `${js}/App.svelte`,
  `<script>import { TerminalViewport } from '@lapismd/terminal/svelte'; import { createTerminalClient } from '@lapismd/terminal'; import { FixtureTransport } from '@lapismd/terminal/testing'; import { createTauriTerminalTransport } from '@lapismd/terminal/tauri'; let session; const client = createTerminalClient(new FixtureTransport()); client.open({targetId:'demo',requestId:'fixture'}).then(value => session = value); const native = createTauriTerminalTransport(); if (typeof native.attach !== 'function') throw new Error('adapter missing');</script>{#if session}<div style="height:300px"><TerminalViewport {session}/></div>{/if}`,
);
run("pnpm", ["install", "--ignore-workspace"], js);
run(
  "node",
  [
    "--input-type=module",
    "-e",
    "import { TerminalGrid } from '@lapismd/terminal'; if (!new TerminalGrid({generation:0, columns:80, screenLines:24})) process.exit(1);",
  ],
  js,
);
run("pnpm", ["exec", "vite", "build"], js);
console.log(
  "Packaged Cargo PTY consumer and npm/Svelte/Tauri consumer passed.",
);
