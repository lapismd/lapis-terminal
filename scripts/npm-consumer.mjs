import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { packageName } from "./npm-registry.mjs";

export function verifyConsumer(root, manifest) {
  const directory = resolve(root, ".local/npm-release/consumer");
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
  const write = (path, value) => writeFileSync(join(directory, path), value);
  const deps = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  ).devDependencies;
  write(
    "package.json",
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          [packageName]: manifest.version,
          svelte: deps.svelte,
          "@tauri-apps/api": deps["@tauri-apps/api"],
        },
        devDependencies: {
          vite: deps.vite,
          "@sveltejs/vite-plugin-svelte": deps["@sveltejs/vite-plugin-svelte"],
        },
      },
      null,
      2,
    ),
  );
  write("public.npmrc", "registry=https://registry.npmjs.org\n");
  const env = {
    ...process.env,
    NPM_CONFIG_USERCONFIG: join(directory, "public.npmrc"),
  };
  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  const run = (command, args) =>
    execFileSync(command, args, { cwd: directory, env, stdio: "inherit" });
  run("npm", [
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ]);
  run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"]);
  const installed = JSON.parse(
    readFileSync(
      join(directory, "node_modules/@lapismd/terminal/package.json"),
      "utf8",
    ),
  );
  if (installed.version !== manifest.version)
    throw Error("Clean npm consumer selected the wrong version");
  write(
    "vite.config.js",
    "import {defineConfig} from 'vite'; import {svelte} from '@sveltejs/vite-plugin-svelte'; export default defineConfig({plugins:[svelte()]});\n",
  );
  write(
    "index.html",
    '<!doctype html><html lang="en"><title>Registry terminal</title><body><div id="app"></div><script type="module" src="/main.js"></script></body></html>',
  );
  write(
    "main.js",
    "import {mount} from 'svelte'; import App from './App.svelte'; mount(App,{target:document.querySelector('#app')});\n",
  );
  write(
    "App.svelte",
    `<script>import {TerminalViewport} from '@lapismd/terminal/svelte'; import {createTerminalClient} from '@lapismd/terminal'; import {FixtureTransport} from '@lapismd/terminal/testing'; import {createTauriTerminalTransport} from '@lapismd/terminal/tauri'; let session; createTerminalClient(new FixtureTransport()).open({targetId:'demo',requestId:'registry'}).then(value=>session=value); if(typeof createTauriTerminalTransport().attach!=='function') throw Error('Tauri adapter absent');</script>{#if session}<div style="height:300px"><TerminalViewport {session}/></div>{/if}`,
  );
  run("node", [
    "--input-type=module",
    "-e",
    "import {TerminalGrid} from '@lapismd/terminal'; if(!new TerminalGrid({generation:0,columns:80,screenLines:24})) throw Error('Grid absent');",
  ]);
  run("npm", ["exec", "--", "vite", "build"]);
  run("npm", ["audit", "signatures"]);
  console.log(
    `Clean frozen registry consumer and cryptographic signatures/provenance passed: ${packageName}@${manifest.version}`,
  );
}
