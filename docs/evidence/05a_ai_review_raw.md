# Task #05 - raw output of the agentic code review (no automatic changes)

- **Reviewer:** a separate Claude Opus 5.5 sub-agent, started from Claude Code on 2026-11-27, read-only instructions.
- **Rules given:** "do not edit, create, delete or rename any file, do not run git commands that change state, and do
  not start servers"; reading files, running the existing tests and read-only `node -e` probes were allowed.
- **Scope given:** correctness against `docs/contract.md`, security (XSS / injection, output encoding, CSP, dev-server
  path handling, data trust), maintainability, testing gaps, failure handling.
- **Code reviewed:** commit `7c74b3d` (code-based v1). The reviewer made no changes (`git status` afterwards showed only
  my own `timing.txt` edit).

The reviewer's report, unchanged except for formatting:

| ID | Category | Severity | Location | Reviewer's claim (short) | Reviewer's own evidence |
|---|---|---|---|---|---|
| R1 | Security / XSS | high | `src/ui.js:31` | `message` is written with `innerHTML`; it contains `item.name` from `catalog.json`, never escaped | node probe: a name `<img src=x onerror=alert(1)>` is returned unescaped in the message; browser run unverified |
| R2 | Security hardening | medium | `index.html:3-8`, `tools/serve.js:16` | no Content-Security-Policy, no `nosniff` header | inspection |
| R3 | Failure handling / data trust | medium | `src/catalog.js:2-8` | `response.ok` never checked; no shape validation | node probes: HTTP 500 with JSON body accepted; missing `stock` gives "undefined in stock"; `"maintenance":"false"` rejects |
| R4 | Failure handling / state before load | medium | `src/ui.js:6-8,33,37-40`, `index.html:31` | button enabled before the catalog loads; a check then shows "Stock unchanged: NO" | `JSON.stringify(null) !== ''`; browser part unverified |
| R5 | Contract (AC6) / consistency | medium | `src/rules.js:7-9` vs `src/ui.js:48-53` | CATALOG_UNAVAILABLE returns decision "Invalid input", the UI writes "No decision"; stale message stays | inspection; T12 test only asserts `!== 'Approved'` |
| R6 | Dev-server robustness | medium | `tools/serve.js:12-15` | `decodeURIComponent` outside `try`: `/%E0%A4%A` throws and may kill the server; traversal probes stayed inside root; `.git/` is served | node probe of `decodeURIComponent`; crash unverified |
| R7 | Testing gaps | medium | `tests/rules.test.js`, `tests/cases.json:2` | no UI tests; `catalog.test.js` mentioned but missing; no HTTP-error / malformed JSON / order-of-checks tests | inspection |
| R8 | Maintainability / duplication | low | `src/ui.js:29,49`, `src/rules.js:4,8` | decision strings hard-coded in UI; catalog error sentence duplicated | inspection |
| R9 | Maintainability | low | `src/ui.js:10-24` | `renderCatalog()` would duplicate `<option>`s if called twice; uses a module global | inspection; not a bug today |
| R10 | Correctness / UX | low | `src/rules.js:23` | "for 1 days" wording; integrity line can only fail through R4 | node probe |

Also reported as checked and correct: order of checks, `parseWholeNumber` rejects `''`, `7.5`, `two`, `-1`, `+3`,
`1e2`, `0x5` and Arabic-Indic digits; T1-T12 reason codes in the logic layer; the frozen catalog (AC5).
The reviewer ran `node --test tests/rules.test.js`: 20 tests, 20 pass, 0 fail.
