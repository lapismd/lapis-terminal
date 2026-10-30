import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { npmPlan, npmTrigger, publishNpm } from "./npm-release.mjs";
import { githubRelease } from "./npm-github-release.mjs";
import { api, checks, env, fixture, run, sha } from "./npm-release-fixture.mjs";

test("npm release requires an explicit main dispatch in the owner repository", () => {
  assert.deepEqual(
    npmTrigger("workflow_dispatch", { inputs: { mode: "publish" } }, env),
    { sha, mode: "publish" },
  );
  for (const [eventName, input, selected] of [
    ["pull_request", "publish", env],
    ["workflow_run", "publish", env],
    ["workflow_dispatch", "bad", env],
    [
      "workflow_dispatch",
      "publish",
      { ...env, GITHUB_REPOSITORY: "fork/terminal" },
    ],
    [
      "workflow_dispatch",
      "publish",
      { ...env, GITHUB_REF: "refs/heads/feature" },
    ],
  ])
    assert.throws(() =>
      npmTrigger(eventName, { inputs: { mode: input } }, selected),
    );
});

test("npm plan requires exact successful main CI, protected checks and consumed changesets", async (t) => {
  const { root, manifest } = fixture(t);
  const trigger = { sha, mode: "publish" };
  const dependencies = {
    api,
    versionState: async () => null,
    registered: async () => false,
  };
  assert.deepEqual(await npmPlan(root, trigger, dependencies), {
    ...trigger,
    version: manifest.version,
    ciRun: 123,
    missing: true,
    bootstrap: true,
    integrity: null,
  });
  for (const replacement of [
    { ...run, event: "pull_request" },
    { ...run, conclusion: "failure" },
  ])
    await assert.rejects(
      npmPlan(root, trigger, {
        ...dependencies,
        api: (path) =>
          path.startsWith("actions/")
            ? { workflow_runs: [replacement] }
            : api(path),
      }),
      /exact revision/,
    );
  await assert.rejects(
    npmPlan(root, trigger, {
      ...dependencies,
      api: (path) =>
        path.startsWith("commits/")
          ? { check_runs: checks.slice(0, 1) }
          : api(path),
    }),
    /Required check/,
  );
  writeFileSync(
    join(root, ".changeset/pending.md"),
    '---\n"@lapismd/terminal": patch\n---\nPending.\n',
  );
  await assert.rejects(npmPlan(root, trigger, dependencies), /Unreleased/);
});

test("npm publication never retries ambiguous uploads or substitutes tokens for OIDC", (t) => {
  const { root, manifest } = fixture(t);
  const plan = { mode: "publish", sha, missing: true, bootstrap: false };
  let uploads = 0;
  const upload = () => {
    uploads++;
    throw Error("unknown upload outcome");
  };
  assert.throws(
    () => publishNpm(root, plan, manifest, { env: {}, run: upload }),
    /unknown upload/,
  );
  assert.equal(uploads, 1);
  assert.throws(
    () =>
      publishNpm(root, plan, manifest, {
        env: { NODE_AUTH_TOKEN: "fixture" },
        run: upload,
      }),
    /trusted publishing/,
  );
  assert.throws(
    () =>
      publishNpm(root, { ...plan, bootstrap: true }, manifest, {
        env: {},
        run: upload,
      }),
    /bootstrap/,
  );
  assert.throws(
    () => publishNpm(root, { ...plan, mode: "verify" }, manifest),
    /cannot publish/,
  );
  publishNpm(
    root,
    { ...plan, missing: false, integrity: manifest.integrity },
    manifest,
    { run: () => assert.fail("already-published version uploaded") },
  );
  assert.throws(
    () =>
      publishNpm(
        root,
        { ...plan, missing: false, integrity: "different" },
        manifest,
      ),
    /differs/,
  );
});

test("GitHub npm releases reject a mismatched tag and do not duplicate an existing exact release", (t) => {
  const { root, manifest } = fixture(t);
  const tag = `${manifest.name}@${manifest.version}`;
  const plan = { sha, version: manifest.version, ciRun: 123 };
  assert.throws(
    () =>
      githubRelease(root, plan, manifest, {
        api: () => ({ object: { type: "commit", sha: "b".repeat(40) } }),
        run: () => assert.fail("invalid release created"),
      }),
    /another source/,
  );
  assert.equal(
    githubRelease(root, plan, manifest, {
      api: (path) =>
        path.startsWith("git/")
          ? { object: { type: "commit", sha } }
          : { tag_name: tag, draft: false, prerelease: false },
      run: () => assert.fail("duplicate release"),
    }),
    tag,
  );
  let created = 0;
  const api404 = () => {
    throw Object.assign(Error("not found"), { stderr: "HTTP 404" });
  };
  assert.equal(
    githubRelease(root, plan, manifest, {
      api: api404,
      run: (command, args) => {
        assert.equal(command, "gh");
        assert.ok(args.includes(sha));
        created++;
      },
    }),
    tag,
  );
  assert.equal(created, 1);
  assert.throws(
    () =>
      githubRelease(root, plan, manifest, {
        api: () => {
          throw Error("HTTP 503");
        },
      }),
    /503/,
  );
});
