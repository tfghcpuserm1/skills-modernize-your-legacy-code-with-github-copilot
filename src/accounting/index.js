'use strict';

const readline = require('node:readline');

// Port of the COBOL system (main.cob, operations.cob, data.cob).
// Balances are integer cents with PIC 9(6)V99 semantics: 0..999999.99.
const MODULUS = 100000000;
const INITIAL_BALANCE = 100000; // 1000.00

// --- DataProgram (data.cob): in-memory balance store ---
let storageBalance = INITIAL_BALANCE;

function dataProgram(operation, balance) {
  if (operation === 'READ') {
    return storageBalance;
  }
  if (operation === 'WRITE') {
    storageBalance = balance;
  }
  return balance;
}

function resetStorage() {
  storageBalance = INITIAL_BALANCE;
}

// --- Helpers replicating COBOL numeric handling ---

// DISPLAY of PIC 9(6)V99, e.g. 001000.00
function formatBalance(cents) {
  const whole = String(Math.floor(cents / 100)).padStart(6, '0');
  const frac = String(cents % 100).padStart(2, '0');
  return `${whole}.${frac}`;
}

// ACCEPT into PIC 9(6)V99: only the first 8 characters are used, the sign is
// dropped, extra decimals are truncated, high-order integer digits overflow
// and non-numeric input becomes 0.
function parseAmount(text) {
  const input = String(text ?? '').slice(0, 8).trim().replace(/^[+-]/, '');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(input)) {
    return 0;
  }
  const [whole = '', frac = ''] = input.split('.');
  const wholePart = Number(whole.slice(-6) || '0');
  const fracPart = Number(frac.padEnd(2, '0').slice(0, 2));
  return wholePart * 100 + fracPart;
}

// --- Operations (operations.cob) ---
// `prompt` asks the user for an amount; `print` writes a line of output.
async function operations(operation, { prompt, print }) {
  if (operation === 'TOTAL ') {
    const balance = dataProgram('READ');
    print(`Current balance: ${formatBalance(balance)}`);
  } else if (operation === 'CREDIT') {
    const amount = parseAmount(await prompt('Enter credit amount: '));
    let balance = dataProgram('READ');
    balance = (balance + amount) % MODULUS; // ADD without ON SIZE ERROR truncates
    dataProgram('WRITE', balance);
    print(`Amount credited. New balance: ${formatBalance(balance)}`);
  } else if (operation === 'DEBIT ') {
    const amount = parseAmount(await prompt('Enter debit amount: '));
    let balance = dataProgram('READ');
    if (balance >= amount) {
      balance -= amount;
      dataProgram('WRITE', balance);
      print(`Amount debited. New balance: ${formatBalance(balance)}`);
    } else {
      print('Insufficient funds for this debit.');
    }
  }
}

// --- MainProgram (main.cob) ---
async function main({ prompt, print }) {
  const io = { prompt, print };
  while (true) {
    print('--------------------------------');
    print('Account Management System');
    print('1. View Balance');
    print('2. Credit Account');
    print('3. Debit Account');
    print('4. Exit');
    print('--------------------------------');
    const answer = await prompt('Enter your choice (1-4): ');
    if (answer === null) {
      break; // input closed; COBOL would loop forever here
    }

    // PIC 9 keeps a single digit; anything else is not 1-4.
    switch (String(answer).trim().charAt(0)) {
      case '1':
        await operations('TOTAL ', io);
        break;
      case '2':
        await operations('CREDIT', io);
        break;
      case '3':
        await operations('DEBIT ', io);
        break;
      case '4':
        print('Exiting the program. Goodbye!');
        return;
      default:
        print('Invalid choice, please select 1-4.');
    }
  }
  print('Exiting the program. Goodbye!');
}

function createConsoleIO() {
  const rl = readline.createInterface({ input: process.stdin });
  const lines = rl[Symbol.asyncIterator]();
  return {
    print: (line) => console.log(line),
    // Mirrors COBOL DISPLAY (message on its own line) then ACCEPT.
    prompt: async (message) => {
      console.log(message);
      const { value, done } = await lines.next();
      return done ? null : value;
    },
    close: () => rl.close(),
  };
}

if (require.main === module) {
  const io = createConsoleIO();
  main(io)
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => io.close());
}

module.exports = {
  main,
  operations,
  dataProgram,
  resetStorage,
  formatBalance,
  parseAmount,
  INITIAL_BALANCE,
};
