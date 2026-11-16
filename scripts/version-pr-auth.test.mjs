import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import YAML from "yaml";

const workflow = YAML.parse(
  readFileSync(
    new URL("../.github/workflows/changesets.yml", import.meta.url),
    "utf8",
  ),
);
const version = workflow.jobs.version;
const writer = version.steps.find((step) =>
  step.uses?.startsWith("changesets/action@"),
);

test("version PRs require canonical main and a repository-scoped App without fallback", () => {
  assert.equal(
    version.if,
    "github.repository == 'lapismd/lapis-terminal' && github.ref == 'refs/heads/main'",
  );
  assert.equal(version.permissions.contents, "read");
  assert.notEqual(version.permissions["pull-requests"], "write");
  const app = version.steps.find((step) =>
    step.uses?.startsWith("actions/create-github-app-token@"),
  );
  assert.ok(app, "version PR writes require an App token");
  assert.equal(app.id, "app");
  assert.equal(app.if, "steps.versioning.outputs.hasChangesets == 'true'");
  assert.equal(app["continue-on-error"], undefined);
  assert.deepEqual(app.with, {
    "client-id": "${{ vars.LAPIS_DEPENDENCY_APP_CLIENT_ID }}",
    "private-key": "${{ secrets.LAPIS_DEPENDENCY_APP_PRIVATE_KEY }}",
    owner: "${{ github.repository_owner }}",
    repositories: "${{ github.event.repository.name }}",
    "permission-contents": "write",
    "permission-pull-requests": "write",
  });
  assert.ok(version.steps.indexOf(app) < version.steps.indexOf(writer));
  // This pinned v1 action prefers explicit GITHUB_TOKEN env over github-token.
  const env = { ...workflow.env, ...version.env, ...writer.env };
  assert.equal(
    env.GITHUB_TOKEN || writer.with?.["github-token"],
    "${{ steps.app.outputs.token }}",
  );
});

test("version preparation keeps API commits and ephemeral checkout credentials", () => {
  const checkout = version.steps.find((step) =>
    step.uses?.startsWith("actions/checkout@"),
  );
  assert.equal(checkout.with["persist-credentials"], false);
  assert.equal(writer.with.version, "pnpm release:version");
  assert.equal(writer.with.commitMode, "github-api");
  assert.equal(writer.with.createGithubReleases, false);
  for (const step of version.steps.filter(
    (step) => step.uses && !step.uses.startsWith("./"),
  ))
    assert.match(step.uses, /@[a-f0-9]{40}$/);
});

test("publisher and dispatch authority remain separate from the PR App", () => {
  const dispatch = version.steps.find(
    (step) => step.name === "Dispatch checks for the bot-created PR",
  );
  assert.equal(dispatch.env.GH_TOKEN, "${{ github.token }}");
  assert.ok(
    dispatch.run.includes(
      'gh workflow run ci.yml --ref "$branch" -f expected_sha="$sha"',
    ),
  );
  assert.ok(
    dispatch.run.includes(
      'gh workflow run publish-spec-pages.yml --ref "$branch"',
    ),
  );
  assert.equal(version.permissions.actions, "write");
});
