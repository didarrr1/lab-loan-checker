# Feature contract: Lab Equipment Loan Checker (Task #01)

Written on 2026-11-27 **before** either implementation and used unchanged by both. The test inputs are stored as data
in `tests/cases.json`.

## User, problem, feature and scope (202 words)
**User.** A KBTU student who wants to borrow equipment from the (fictional) Electronics Lab 204 for a course project.

**Problem.** Today the student only sees a catalog table (baseline v0). It does not say whether a request is allowed,
so students walk to the lab and are turned away: an item is under maintenance, there are not enough units, or they ask
for too many units or too many days. The lab assistant answers the same questions every day.

**Feature.** A loan-request checker. The student chooses an item, types a quantity and a number of days and presses
"Check request". The page answers **Approved**, **Rejected** or **Invalid input**, shows a reason code and one clear
sentence, and confirms that the stock was not changed.

**Scope.** The checker only checks; it never reserves, reduces stock or stores anything. The catalog is a fixed
fictional JSON file (`data/catalog.json`) with four items. Both implementations load exactly this file. Out of scope:
login, real student data, payments, a database, e-mail, an LLM feature and staff screens. The check must work the same
in the code-based page and in the low-code app, with identical inputs, outputs and rules, so that the two approaches
can be compared fairly.

## Acceptance criteria
| ID | Criterion (observable) | Reason code(s) |
|---|---|---|
| AC1 | A valid request for an item that is not under maintenance, with quantity <= stock, is **Approved**. | `APPROVED` |
| AC2 | Quantity must be a whole number from 1 to 5 and the loan period a whole number of days from 1 to 14. Outside these limits the result is **Invalid input**. | `QUANTITY_OUT_OF_RANGE`, `DAYS_OUT_OF_RANGE` |
| AC3 | An item under maintenance, or a quantity greater than the stock, is **Rejected**. | `ITEM_UNAVAILABLE`, `INSUFFICIENT_STOCK` |
| AC4 | Invalid input (no item, unknown item, empty / text / decimal / negative-sign numbers) gives **Invalid input** with a message that names the field; no decision is made. | `INVALID_ITEM`, `INVALID_QUANTITY`, `INVALID_DAYS` |
| AC5 | Checking never changes the catalog: repeating the same check gives the same result and the stock stays the same. | (all) |
| AC6 | If the catalog cannot be loaded, the page shows a clear error, disables the check button and makes no decision. | `CATALOG_UNAVAILABLE` |

**Order of checks (both solutions):** catalog loaded → item → quantity format → days format → quantity range → days
range → maintenance → stock → approved. Only the first failing rule is reported.

## Inputs
| Input | Type | Notes |
|---|---|---|
| Item | selection from the catalog | empty choice "- choose an item -" is allowed, so that INVALID_ITEM can be tested |
| Quantity | text, whole units | a text field on purpose, so that 0, 6, decimals and text can be tested |
| Loan days | text, whole days | same reason |
| Catalog | `data/catalog.json` (read-only) | ARD-01 Arduino kit stock 6; RPI-02 Raspberry Pi kit stock 2; OSC-03 oscilloscope stock 1, maintenance; VR-04 VR headset stock 3 |

## Outputs
| Output | Values |
|---|---|
| Decision | `Approved` / `Rejected` / `Invalid input` |
| Reason code | `APPROVED`, `QUANTITY_OUT_OF_RANGE`, `DAYS_OUT_OF_RANGE`, `ITEM_UNAVAILABLE`, `INSUFFICIENT_STOCK`, `INVALID_ITEM`, `INVALID_QUANTITY`, `INVALID_DAYS`, `CATALOG_UNAVAILABLE` |
| Message | one sentence, for example "2 x Arduino Uno starter kit for 7 days can be borrowed (6 in stock)." |
| Integrity line | "Stock unchanged: yes (n checks)" |

## Common test cases (prepared before implementation)
| ID | Category | Item | Qty | Days | Expected decision | Expected reason |
|---|---|---|---|---|---|---|
| T1 | normal | ARD-01 | 2 | 7 | Approved | `APPROVED` |
| T2 | boundary (max qty, max days) | ARD-01 | 5 | 14 | Approved | `APPROVED` |
| T3 | boundary (qty 6) | ARD-01 | 6 | 7 | Invalid input | `QUANTITY_OUT_OF_RANGE` |
| T4 | boundary (days 15) | ARD-01 | 1 | 15 | Invalid input | `DAYS_OUT_OF_RANGE` |
| T5 | boundary (qty = stock, min days) | RPI-02 | 2 | 1 | Approved | `APPROVED` |
| T6 | rule (stock) | RPI-02 | 3 | 7 | Rejected | `INSUFFICIENT_STOCK` |
| T7 | rule (maintenance) | OSC-03 | 1 | 3 | Rejected | `ITEM_UNAVAILABLE` |
| T8 | invalid input (text) | ARD-01 | two | 7 | Invalid input | `INVALID_QUANTITY` |
| T9 | invalid input / error feedback | (none) | 1 | 1 | Invalid input | `INVALID_ITEM` |
| T10 | boundary (zeros, first failing rule) | VR-04 | 0 | 0 | Invalid input | `QUANTITY_OUT_OF_RANGE` |
| T11 | repeated operation | T1 three times | | | Approved each time; ARD-01 stock still 6 | `APPROVED` |
| T12 | failure handling | catalog cannot be loaded | | | error shown, button disabled | `CATALOG_UNAVAILABLE` |
