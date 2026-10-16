import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { files } from "./architecture.mjs";
const { packages } = JSON.parse(
  execFileSync("cargo", ["metadata", "--no-deps", "--format-version", "1"], {
    encoding: "utf8",
  }),
);
for (const pkg of packages)
  for (const dep of pkg.dependencies) {
    if (dep.path && !dep.path.startsWith(process.cwd() + "/"))
      throw new Error(`${pkg.name}: sibling dependency`);
    if (
      pkg.name === "lapis-terminal-engine" &&
      /tauri|portable-pty|reqwest|axum|jj-store/.test(dep.name)
    )
      throw new Error(`${pkg.name}: invalid dependency ${dep.name}`);
    if (
      pkg.name === "lapis-terminal-runtime" &&
      /tauri|reqwest|axum|jj-store/.test(dep.name)
    )
      throw new Error(`${pkg.name}: invalid dependency ${dep.name}`);
  }
for (const file of files().filter(
  (p) => p.startsWith("packages/terminal/src/") && /\.(ts|svelte)$/.test(p),
)) {
  const source = readFileSync(file, "utf8");
  if (
    /globalThis\.app|__JJ_STORE|from ["'][^"']*(?:catalog|examples|jj-store|lapis-notes)/.test(
      source,
    )
  )
    throw new Error(`${file}: application dependency`);
  if (!file.includes("/tauri/") && /from ["']@tauri-apps/.test(source))
    throw new Error(`${file}: native import outside adapter`);
}
console.log("Package boundaries pass");
