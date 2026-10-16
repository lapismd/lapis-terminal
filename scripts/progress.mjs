import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
for (const file of [
  "spec/src/current/verification.md",
  "spec/src/current/progress/milestones.md",
]) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!existsSync(resolve(dirname(file), match[1])))
      throw new Error(`${file}: missing evidence ${match[1]}`);
  }
  for (const line of source.split("\n"))
    if (/\| (?:Done|Implemented) *\|/.test(line) && !line.includes("]("))
      throw new Error(`${file}: completed row without evidence`);
}
console.log("Progress evidence links pass");
