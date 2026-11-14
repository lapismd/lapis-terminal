# Core 0.13.2 release-contract intake

Main `d1e1848f87ca28578860e2fed307fa94b7b21ecb` merged the compatible
Design Core floor from PR #18. The exact source CI command
`pnpm spec:check --base 8da1f702ae3bbc4605445011417d4d5d05ee732c --head d1e1848f87ca28578860e2fed307fa94b7b21ecb`
failed with one mapped release-chapter finding. The same command reproduced
that single finding locally before this documentation update.

The dependency remains within the already-qualified Core 0.13 line. This
slice records its unchanged release contract and concrete source identity;
no product code, runtime assertion, release permission or native acceptance
requirement changes. The package already resolves Core 0.13.2.

The Deno-free spec-validator doctor currently reports its default
`spec/src/verification.md` as missing even though this repository configures
`current/verification.md`. Actual canonical validation uses the configured
verification map; no duplicate chapter or consumer shim is added.

The first documentation validation found the newly added evidence chapter
missing from SUMMARY.md; it was added rather than excluded from validation.
The repaired source range then passes all eight `pnpm spec:check` lanes,
including formatting, release-state checks and mapped spec-first. The
main-push mapped-chapter failure changes from one finding to zero.
