import { spawnSync } from "node:child_process";
const result = spawnSync("pnpm", ["exec", "tauri", process.argv[2] ?? "dev"], {
  cwd: "examples/desktop",
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
