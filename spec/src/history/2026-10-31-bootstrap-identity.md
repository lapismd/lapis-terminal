# Bootstrap signer identity correction

Enclosing change: `oxmwpzpm`. Requirements: LTERM-RELEASE-006,
LTERM-RELEASE-007, LTERM-GOV-100 and LTERM-GOV-103. M5/M6 review retains the
actual registry/provenance/consumer completion gates. No npm package, staged
candidate, detached signing artifact or tag was created before this correction.

## Reproduction and repair

The published Sigstore 4.1.1 API overload is `verify(bundle, policy)` for an
embedded DSSE payload. Passing `undefined` as argument two with a policy as
argument three silently replaces the policy with undefined. Cryptographic
verification still runs, but the requested issuer/SAN policy is ignored.
The initial mock used the same mistaken three-argument contract and missed it.

The corrected public-API call-shape regression in
`node --test scripts/npm-provenance.test.mjs` failed **one of two** tests before
the repair because the policy argument was absent. The implementation now calls
the supported two-argument overload and independently checks the verified
signer's exact issuer and workflow SAN. Missing identity, wrong issuer and a
foreign workflow all fail closed before the bundle is written.

The same focused command then passed **three of three** tests. The third test
uses the real public Sigstore verifier and an immutable signed npm fixture:

- Source: `https://registry.npmjs.org/-/npm/v1/attestations/@lapismd%2fdesign-core@0.7.1`.
- File: `scripts/fixtures/design-core-0.7.1-provenance.json`; 12,005 bytes.
- SHA-256: `e68da538522ac91ccf86a1ca0472c71f3895e79a1adf997e27155911c07d7c60`.
- The unmodified bundle verifies cryptographically as Design Core's main
  `release.yml` workflow. Terminal's real verifier rejects that valid foreign
  identity, and rejects a tampered payload. TUF supplies current trust metadata;
  no signing credential or npm authentication is involved.

The coordinated 0.1.2 version PR #5 was separately approved and merged at
`b235b4189fc6c0eccfc8a01285002c21a235fca1` after full required PR CI
`41146798073` and specification `41146797902` passed. Earlier dispatched checks
passed too, but GitHub required maintainer approval of the PR-event workflows;
those were approved and passed without bypassing branch protection. Cargo
source is unaffected by this release-tool-only correction. Initial npm signing
and publication wait for the corrected helper's complete protected source CI.

Local widening passed all **21 release tests** and all **eight specification
lanes**, including formatting, architecture, boundaries, progress, coordinated
metadata, mdBook and spec-first. The correction remains a release-tool change;
full protected hosted CI will still run before merge and bootstrap signing.

## Cargo event-trigger correction

The first automatic 0.1.2 Cargo run `41148121586` passed qualification but failed
before authentication/upload: crates.io returned HTTP400 because trusted
publishing does not support `workflow_run`. Registry inspection confirmed all
three exact 0.1.2 versions absent. The already supported manual main dispatch
was started as `41148378559` after that inspection; no ambiguous upload was
retried and no local token fallback was used.

The automatic workflow now limits workflow-run handling to read-only planning
and an Actions-only relay to a new main workflow dispatch. Only that supported
event enters protected OIDC publication, and repeats all qualification and
registry checks. A focused regression checks the exact scoped dispatch and
refuses verify, deferred or already-published plans. Required source/native
validation and coordinated Cargo version policy remain intact.

After adding the Cargo relay, focused Cargo/Sigstore tests passed 10/10, all
22 release tests passed, explicit actionlint passed, and all eight specification
lanes passed. The supported manual Cargo recovery reached actual publication;
its final registry/workflow results remain to be verified before completion.
