import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
const git = (args, input) =>
  execFileSync("git", args, { encoding: "utf8", input }).trim();
const head = git(["rev-parse", "HEAD"]);
if (process.env.CI_EXPECTED_SHA && process.env.CI_EXPECTED_SHA !== head)
  throw Error(
    "dispatched revision changed; rerun checks on the current PR head",
  );
let base = process.env.CI_BASE_SHA;
if (base && /^0+$/.test(base))
  base = git(["hash-object", "-t", "tree", "--stdin"], "");
else if (base && process.env.CI_EVENT === "pull_request")
  base = git(["merge-base", base, head]);
else if (!base) {
  base =
    process.env.GITHUB_REF === "refs/heads/main"
      ? git(["rev-parse", `${head}^`])
      : git(["merge-base", "origin/main", head]);
}
if (!/^[a-f0-9]{40}$/.test(base) || !/^[a-f0-9]{40}$/.test(head))
  throw Error("invalid CI revision");
appendFileSync(
  process.env.GITHUB_ENV,
  `LAPIS_TERMINAL_CHECK_BASE=${base}\nLAPIS_TERMINAL_CHECK_HEAD=${head}\n`,
);
console.log(`Checking ${base}..${head}`);
