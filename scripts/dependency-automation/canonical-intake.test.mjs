import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";
import { parse, stringify } from "yaml";
import {
  coreFacts,
  verifyCoreCanonicalIntake,
} from "./check-canonical-intake.mjs";
import { sourceIntakeReader } from "./source-intake-reader.mjs";
const fixture = JSON.parse(
  gunzipSync(
    readFileSync(new URL("../fixtures/core-intake.json.gz", import.meta.url)),
  ),
);
const policyBytes = readFileSync(
  new URL(
    "../../.github/dependency-automation/canonical-intake.json",
    import.meta.url,
  ),
  "utf8",
);
const { chapters } = JSON.parse(policyBytes);
const document = (facts) =>
  "# Source\n\n<!-- dependency-intake:core-development:start -->\n\n```json\n" +
  JSON.stringify(facts, null, 2) +
  "\n```\n\n<!-- dependency-intake:core-development:end -->\n";
function input() {
  const before = structuredClone(fixture.before),
    files = structuredClone(fixture.after);
  return {
    before,
    files,
    policyBytes,
    basePolicyBytes: policyBytes,
    changedFiles: [...Object.keys(files), ...chapters],
    baseDocuments: Object.fromEntries(
      chapters.map((p) => [p, document(coreFacts(before, policyBytes))]),
    ),
    documents: Object.fromEntries(
      chapters.map((p) => [p, document(coreFacts(files, policyBytes))]),
    ),
  };
}
test("actual released validator patch pair is independently verified", () =>
  assert.equal(verifyCoreCanonicalIntake(input()).version, "0.13.5"));
for (const [name, mutate] of [
  [
    "stale facts",
    (d) => (d.documents[chapters[0]] = d.baseDocuments[chapters[0]]),
  ],
  ["missing facts", (d) => (d.documents[chapters[0]] = "none")],
  [
    "duplicate markers",
    (d) => (d.documents[chapters[0]] += d.documents[chapters[0]]),
  ],
  ["manual chapter edits", (d) => (d.documents[chapters[0]] += "Manual text")],
  ["changed policy", (d) => (d.basePolicyBytes += " ")],
  ["unexpected source", (d) => d.changedFiles.push("src/index.ts")],
  [
    "unrelated lock drift",
    (d) => (d.files["pnpm-lock.yaml"] += "\nunknownSetting: changed\n"),
  ],
  [
    "public contract drift",
    (d) => {
      const m = JSON.parse(d.files["package.json"]);
      m.peerDependencies = { ...(m.peerDependencies ?? {}), react: "^20" };
      d.files["package.json"] = JSON.stringify(m);
    },
  ],
  [
    "forged integrity",
    (d) =>
      (d.files["pnpm-lock.yaml"] = d.files["pnpm-lock.yaml"].replace(
        coreFacts(d.files, d.policyBytes).integrity,
        "sha512-" + Buffer.alloc(64, 3).toString("base64"),
      )),
  ],
  [
    "unrelated same-version dependency edge",
    (d) => {
      const lock = parse(d.files["pnpm-lock.yaml"]);
      const [key, row] = Object.entries(lock.snapshots).find(
        ([k, r]) =>
          !k.startsWith("@lapismd/design-core@") &&
          r.dependencies &&
          Object.keys(r.dependencies).length,
      );
      const key2 = Object.keys(row.dependencies)[0];
      lock.snapshots[key].dependencies[key2] += "(unreviewed@1.0.0)";
      d.files["pnpm-lock.yaml"] = stringify(lock);
    },
  ],
])
  test("rejects " + name + " without mutation", () => {
    const d = input();
    mutate(d);
    const saved = structuredClone(d);
    assert.throws(() => verifyCoreCanonicalIntake(d));
    assert.deepEqual(d, saved);
  });
for (const hasJj of [true, false])
  test(
    "source reader uses only read-only " + (hasJj ? "JJ" : "Git") + " ancestry",
    () => {
      const calls = [];
      const read = sourceIntakeReader(
        "/source",
        (binary, args) => {
          calls.push([binary, args]);
          return calls.length === 1 ? "a".repeat(40) + "\n" : "source bytes";
        },
        hasJj,
      );
      assert.equal(read("package.json"), "source bytes");
      assert.equal(calls[0][0], hasJj ? "jj" : "git");
      assert.deepEqual(
        calls[1],
        hasJj
          ? [
              "jj",
              [
                "--ignore-working-copy",
                "file",
                "show",
                "-r",
                "a".repeat(40),
                "--",
                "package.json",
              ],
            ]
          : ["git", ["show", "a".repeat(40) + ":package.json"]],
      );
    },
  );
test("source reader fails on unavailable ancestry", () =>
  assert.throws(() => sourceIntakeReader("/source", () => "", false)));
