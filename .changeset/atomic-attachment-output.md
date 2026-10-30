---
"@lapismd/terminal": patch
---

Preserve PTY output arriving during initial attachment by capturing the bootstrap
and installing its subscription under the publisher mutex.
