import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const fixtures = {
  terminal: {
    bundle: "terminal-rejected-github-metadata.json",
    url: "https://registry.npmjs.org/@lapismd/terminal/-/terminal-0.1.2.tgz",
    integrity:
      "sha512-0E6mUoG6gycc3G0nxmkuiZQT31DPnZdscWQdeidxiDNnYFDjb/JKCaOuaIbyn2hjSEd6a9UBu6rteeajuIrDcQ==",
    sourceSha: "2523a0b50a77e22f3b6400b73bf2e3096756c454",
    version: "0.1.2",
  },
  core: {
    bundle: "design-core-0.7.1-provenance.json",
    url: "https://registry.npmjs.org/@lapismd/design-core/-/design-core-0.7.1.tgz",
    integrity:
      "sha512-20HXAco2bMF4vwlztCDbQ7Hc0gv5byhmLZZ40IEuErmi/q4DGOGL/pKnHqkmGnNR43Bi3TFN967FAR85M5Ru2Q==",
    sourceSha: "72aed92f613f6f27781734a16332d6602a354507",
    version: "0.7.1",
  },
};
const artifacts = new Map();
export async function cryptoFixture(name) {
  const selected = fixtures[name];
  if (!selected) throw Error("Unknown public crypto fixture");
  if (!artifacts.has(name))
    artifacts.set(
      name,
      (async () => {
        const response = await fetch(selected.url, {
          signal: AbortSignal.timeout(30000),
        });
        assert(response.ok, "public immutable artifact must be available");
        const bytes = Buffer.from(await response.arrayBuffer());
        assert.equal(
          "sha512-" + createHash("sha512").update(bytes).digest("base64"),
          selected.integrity,
        );
        return bytes;
      })(),
    );
  return {
    bundle: JSON.parse(
      readFileSync(
        new URL("./fixtures/" + selected.bundle, import.meta.url),
        "utf8",
      ),
    ),
    artifact: await artifacts.get(name),
    sourceSha: selected.sourceSha,
    version: selected.version,
  };
}
