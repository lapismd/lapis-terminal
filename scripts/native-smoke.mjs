import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
const child = spawn("target/debug/lapis-terminal-demo", [], {
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
let output = "",
  errors = "",
  pids = [];
child.stdout.on("data", (data) => {
  output += data;
  for (const line of output.split("\n"))
    if (line.startsWith("LAPIS_TERMINAL_PROGRESS="))
      pids = JSON.parse(line.slice(line.indexOf("=") + 1)).pids;
});
child.stderr.on("data", (data) => (errors += data));
const timer = setTimeout(() => child.kill("SIGTERM"), 90000);
const code = await new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("exit", resolve);
});
clearTimeout(timer);
const line = output
  .split("\n")
  .find((line) => line.startsWith("LAPIS_TERMINAL_SMOKE="));
const report = line
  ? JSON.parse(line.slice(line.indexOf("=") + 1))
  : { ok: false, error: "Native smoke did not report", pids };
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const deadline = Date.now() + 5000;
while (report.pids.some(alive) && Date.now() < deadline)
  await new Promise((resolve) => setTimeout(resolve, 25));
report.survivors = report.pids.filter(alive);
report.exitCode = code;
report.ok = report.ok && code === 0 && !report.survivors.length;
mkdirSync(".local/evidence", { recursive: true });
writeFileSync(
  ".local/evidence/native-smoke.json",
  JSON.stringify({ ...report, stderr: errors }, null, 2),
);
console.log(JSON.stringify(report, null, 2));
// Only exact PIDs emitted by this disposable fixture are eligible for cleanup.
for (const pid of report.survivors) {
  try {
    process.kill(pid, "SIGKILL");
  } catch {}
}
if (!report.ok) process.exitCode = 1;
