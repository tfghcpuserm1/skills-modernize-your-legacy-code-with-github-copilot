# Test Plan: COBOL Account Management System

This plan covers the business logic of the current COBOL application in
[`src/cobol/`](../src/cobol/) (see [README.md](./README.md) for the design). It is
intended for validation with business stakeholders and as the basis for unit and
integration tests in the Node.js rewrite.

## How to use this plan

- **Actual Result** and **Status** are blank (`TBD`) until a case is executed.
  Stakeholders should review the **Expected Result** column, which reflects the
  behavior of the current COBOL app.
- Unless stated otherwise, every case starts from a fresh program launch, so the
  balance is `1000.00` (the initial value stored in `DataProgram`). The balance
  is held in memory only and is not persisted between runs.
- Amounts are displayed as `NNNNNN.NN` (six integer digits, two decimals, zero
  padded), e.g. `001000.00`.
- Layers for Node.js tests: **UI** = menu handling (`main.cob`), **OPS** =
  business rules (`operations.cob`), **DATA** = balance storage (`data.cob`).
- Cases marked **⚠ Legacy behavior** record what the COBOL app actually does, but
  that behavior is likely a defect. Stakeholders must decide whether the Node.js
  app should replicate it or correct it.

## Test cases

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-001 | Main menu is displayed on startup (UI) | App launched | 1. Start the app | Menu shows the title "Account Management System" and options 1. View Balance, 2. Credit Account, 3. Debit Account, 4. Exit, followed by the prompt "Enter your choice (1-4): " | TBD | TBD | |
| TC-002 | Menu redisplays after each operation (UI) | App launched | 1. Choose `1`<br>2. Observe output | Balance is shown, then the menu is displayed again and awaits input | TBD | TBD | Loop continues until Exit is chosen |
| TC-003 | Exit the application (UI) | App launched | 1. Choose `4` | "Exiting the program. Goodbye!" is displayed and the app terminates | TBD | TBD | |
| TC-004 | Invalid numeric menu choice is rejected (UI) | App launched | 1. Enter `5`<br>2. Enter `0` | "Invalid choice, please select 1-4." is displayed for each; menu is redisplayed; balance unchanged | TBD | TBD | |
| TC-005 | Non-numeric menu choice is rejected (UI) | App launched | 1. Enter `A` | "Invalid choice, please select 1-4." is displayed; menu is redisplayed | TBD | TBD | Menu input is a single digit (`PIC 9`) |
| TC-006 | Multi-digit menu choice uses only the first digit (UI) | App launched | 1. Enter `12` | Behavior is the same as entering `1` (balance is displayed) | TBD | TBD | ⚠ Legacy behavior: only the first character is used; confirm intended handling with stakeholders |
| TC-007 | Initial balance is 1000.00 (OPS/DATA) | App launched | 1. Choose `1` | "Current balance: 001000.00" is displayed | TBD | TBD | |
| TC-008 | Viewing the balance does not change it (OPS) | App launched | 1. Choose `1` twice | Both displays show `001000.00` | TBD | TBD | |
| TC-009 | Credit a whole-number amount (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `100` | "Amount credited. New balance: 001100.00" is displayed | TBD | TBD | |
| TC-010 | Credit an amount with decimals (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `10.25` | "Amount credited. New balance: 001010.25" is displayed | TBD | TBD | |
| TC-011 | Credited amount is persisted (OPS/DATA) | Balance is 1000.00 | 1. Choose `2`, enter `100`<br>2. Choose `1` | "Current balance: 001100.00" is displayed | TBD | TBD | Verifies the WRITE then READ round trip |
| TC-012 | Consecutive credits accumulate (OPS/DATA) | Balance is 1000.00 | 1. Credit `100`<br>2. Credit `50.50`<br>3. View balance | Balances shown: `001100.00`, `001150.50`, then `001150.50` | TBD | TBD | |
| TC-013 | Credit of zero (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `0` | "Amount credited. New balance: 001000.00"; balance unchanged | TBD | TBD | ⚠ Legacy behavior: no rule rejects a zero amount |
| TC-014 | Debit a whole-number amount (OPS) | Balance is 1000.00 | 1. Choose `3`<br>2. Enter `50` | "Amount debited. New balance: 000950.00" is displayed | TBD | TBD | |
| TC-015 | Debit an amount with decimals (OPS) | Balance is 1000.00 | 1. Choose `3`<br>2. Enter `10.25` | "Amount debited. New balance: 000989.75" is displayed | TBD | TBD | |
| TC-016 | Debited amount is persisted (OPS/DATA) | Balance is 1000.00 | 1. Choose `3`, enter `50`<br>2. Choose `1` | "Current balance: 000950.00" is displayed | TBD | TBD | |
| TC-017 | Debit equal to the balance is allowed (OPS) | Balance is 1000.00 | 1. Choose `3`<br>2. Enter `1000` | "Amount debited. New balance: 000000.00"; a later View Balance shows `000000.00` | TBD | TBD | Boundary: rule is balance >= amount |
| TC-018 | Debit exceeding the balance is rejected (OPS) | Balance is 1000.00 | 1. Choose `3`<br>2. Enter `1000.01` | "Insufficient funds for this debit." is displayed | TBD | TBD | Boundary: one cent over the balance |
| TC-019 | Rejected debit leaves the balance unchanged (OPS/DATA) | Balance is 1000.00 | 1. Choose `3`, enter `5000`<br>2. Choose `1` | "Insufficient funds for this debit." then "Current balance: 001000.00" | TBD | TBD | No WRITE occurs on a rejected debit |
| TC-020 | Debit when the balance is zero (OPS) | Balance is 0.00 (after TC-017) | 1. Choose `3`<br>2. Enter `0.01` | "Insufficient funds for this debit." is displayed | TBD | TBD | |
| TC-021 | Credit after the balance reaches zero (OPS) | Balance is 0.00 (after TC-017) | 1. Choose `2`, enter `0.50`<br>2. Choose `1` | "Amount credited. New balance: 000000.50", then "Current balance: 000000.50" | TBD | TBD | |
| TC-022 | Debit of zero (OPS) | Balance is 1000.00 | 1. Choose `3`<br>2. Enter `0` | "Amount debited. New balance: 001000.00"; balance unchanged | TBD | TBD | ⚠ Legacy behavior: no rule rejects a zero amount |
| TC-023 | Mixed sequence of transactions (integration) | App launched | 1. Credit `100`<br>2. Debit `50`<br>3. Debit `5000`<br>4. View balance<br>5. Exit | Displays: `001100.00`, `001050.00`, insufficient funds message, `001050.00`, goodbye | TBD | TBD | End-to-end flow across UI, OPS and DATA |
| TC-024 | Balance resets on each application start (DATA) | A prior run changed the balance | 1. Credit `100`, then exit<br>2. Restart the app<br>3. View balance | "Current balance: 001000.00" is displayed | TBD | TBD | Balance is not persisted; confirm whether the Node.js app should persist it |
| TC-025 | Negative credit amount (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `-50` | "Amount credited. New balance: 001050.00" | TBD | TBD | ⚠ Legacy behavior: the amount field is unsigned, so the sign is dropped and `-50` is treated as `50` |
| TC-026 | Negative debit amount (OPS) | Balance is 1000.00 | 1. Choose `3`<br>2. Enter `-50` | "Amount debited. New balance: 000950.00" | TBD | TBD | ⚠ Legacy behavior: sign is dropped, so `-50` is treated as a normal `50` debit |
| TC-027 | Non-numeric transaction amount (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `abc` | "Amount credited. New balance: 001000.00"; balance unchanged | TBD | TBD | ⚠ Legacy behavior: invalid input is silently treated as 0 and no error is shown |
| TC-028 | More than two decimal places are truncated (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `1.239` | "Amount credited. New balance: 001001.23" | TBD | TBD | ⚠ Legacy behavior: truncated, not rounded |
| TC-029 | Credit that exceeds the maximum balance (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `999999` | "Amount credited. New balance: 000999.00" | TBD | TBD | ⚠ Legacy behavior: the balance holds at most `999999.99`; overflow silently drops the high-order digit (1000 + 999999 = 1000999 becomes 000999.00) |
| TC-030 | Maximum representable balance (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `998999.9`<br>3. View balance | "Amount credited. New balance: 999999.90" then "Current balance: 999999.90" | TBD | TBD | Boundary: the balance holds at most six integer digits and two decimals |
| TC-031 | Amount input longer than 8 characters is truncated (OPS) | Balance is 1000.00 | 1. Choose `2`<br>2. Enter `998999.99` | "Amount credited. New balance: 999999.90" | TBD | TBD | ⚠ Legacy behavior: only the first 8 typed characters are used, so the final `9` is dropped silently |

## Coverage summary

| Business rule / behavior | Test cases |
| --- | --- |
| Menu display, loop, exit, invalid choice handling | TC-001 to TC-006, TC-023 |
| Initial balance of 1000.00 and read-only balance view | TC-007, TC-008 |
| Credit adds the amount and persists it | TC-009 to TC-013, TC-021 |
| Debit subtracts the amount and persists it | TC-014 to TC-017, TC-022 |
| Debit allowed only when balance >= amount; rejected debits change nothing | TC-017 to TC-020 |
| Data store READ/WRITE round trip and in-memory lifetime | TC-011, TC-016, TC-019, TC-024 |
| Input and numeric-limit edge cases (legacy gaps) | TC-006, TC-013, TC-022, TC-025 to TC-031 |

## Notes for stakeholders

- The legacy app has no student-specific rules. It manages a single balance with
  no student ID, account type, fees or limits.
- The ⚠ cases show unvalidated input handling. For each one, decide whether the
  Node.js app should preserve the behavior or reject the input with an error.
  Update the Expected Result of those cases once decided.
- When the app reaches end of input without the user choosing Exit, it loops
  repeatedly printing the invalid-choice message. This only affects scripted
  runs, so there is no test case for it.
