# Changesets

Run `pnpm changeset` and select `@lapismd/terminal` for changes to the shared
terminal distribution, including its Rust crates. Use patch, minor or major
according to the public contract change. Empty changesets are suitable for
changes that do not affect the distributed packages.

`pnpm release:version` consumes pending notes and synchronizes the npm package,
three Cargo crates, demo metadata, lockfiles and canonical release evidence.
The private root and demo are never npm publications. The GitHub workflow opens
or updates `changeset-release/main` and dispatches CI for that exact PR head.
It does not merge, create tags or publish registry packages.
