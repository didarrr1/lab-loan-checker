# Lab Equipment Loan Checker: code-based vs low-code

KBTU, Software Engineering, Assignment #06. Bakir Didar, 24B031711.

One small feature built twice against one contract ([docs/contract.md](docs/contract.md)): a student chooses an item
from a fictional lab catalog, types a quantity and a number of loan days, and sees **Approved**, **Rejected** or
**Invalid input** with a reason code. Nothing is reserved or stored. All data is fictional.

| Track | Where | Live demo |
|---|---|---|
| Code-based | `index.html`, `styles.css`, `src/`, `data/`, `tests/`: plain HTML + JavaScript modules, no dependencies | GitHub Pages: https://didarrr1.github.io/lab-loan-checker/ |
| Low-code | Appsmith Cloud (free plan); JS object source in `lowcode/Checker.js`, export in `lowcode/` | see the report |

## Code-based track
| Layer | File | Responsibility |
|---|---|---|
| Input validation | `src/validation.js` | `parseWholeNumber`, `validateRequest` (AC2, AC4) |
| Core logic | `src/rules.js` | `checkLoan` (AC1, AC3, AC5, AC6), decisions and messages |
| Data | `src/catalog.js`, `data/catalog.json` | load, validate and freeze the catalog (AC5, AC6) |
| Output | `src/ui.js`, `index.html`, `styles.css` | form, result, catalog table; `textContent` only, CSP |
| Tests | `tests/cases.json`, `tests/rules.test.js`, `tests/catalog.test.js` | shared T1-T12 cases + boundaries, failure handling, static and server checks |

## Build, run and test
Needs Node.js 18 or newer; there is nothing to install and no build step.
```
npm test        # node --test: 35 tests
npm start       # local static server on http://127.0.0.1:5186
```

## Evidence
- `docs/contract.md`: feature contract, acceptance criteria, shared test cases (written before implementation)
- `docs/evidence/`: raw test outputs, the AI review log, DAST probes, timing log
- `docs/report/A6_Bakir_Didar_Report.pdf` (and `.md`): full report: 12-case test table, review log, security checklist, comparison matrix, release decision
- `docs/screenshots/`: screenshots of both implementations

No secrets, API keys or real personal data are stored in this repository.
