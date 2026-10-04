'use strict';

// Unit tests mirroring docs/TESTPLAN.md (TC-001 .. TC-031).
const {
  main,
  operations,
  dataProgram,
  resetStorage,
  formatBalance,
  parseAmount,
} = require('./index');

const MENU = [
  '--------------------------------',
  'Account Management System',
  '1. View Balance',
  '2. Credit Account',
  '3. Debit Account',
  '4. Exit',
  '--------------------------------',
];
const CHOICE_PROMPT = 'Enter your choice (1-4): ';
const INVALID = 'Invalid choice, please select 1-4.';
const GOODBYE = 'Exiting the program. Goodbye!';
const INSUFFICIENT = 'Insufficient funds for this debit.';

// Runs the app with scripted input; returns everything the user would see.
async function run(inputs) {
  const queue = [...inputs];
  const out = [];
  await main({
    print: (line) => out.push(line),
    prompt: async (message) => {
      out.push(message);
      return queue.length ? queue.shift() : null;
    },
  });
  return out;
}

// Only the business messages (menu and prompts removed).
const results = (out) =>
  out.filter(
    (l) => !MENU.includes(l) && l !== CHOICE_PROMPT && !/^Enter (credit|debit) amount/.test(l)
  );

beforeEach(() => {
  resetStorage(); // each test is a fresh program launch
});

describe('Menu and navigation (UI)', () => {
  test('TC-001 main menu is displayed on startup', async () => {
    const out = await run(['4']);
    expect(out.slice(0, 8)).toEqual([...MENU, CHOICE_PROMPT]);
  });

  test('TC-002 menu redisplays after each operation', async () => {
    const out = await run(['1', '4']);
    const menuCount = out.filter((l) => l === 'Account Management System').length;
    expect(menuCount).toBe(2);
    expect(out).toContain('Current balance: 001000.00');
  });

  test('TC-003 exit terminates with goodbye', async () => {
    const out = await run(['4']);
    expect(out[out.length - 1]).toBe(GOODBYE);
    expect(out.filter((l) => l === GOODBYE)).toHaveLength(1);
  });

  test('TC-004 invalid numeric choices are rejected', async () => {
    const out = await run(['5', '0', '1', '4']);
    expect(results(out)).toEqual([INVALID, INVALID, 'Current balance: 001000.00', GOODBYE]);
    expect(out.filter((l) => l === 'Account Management System')).toHaveLength(4);
  });

  test('TC-005 non-numeric choice is rejected', async () => {
    const out = await run(['A', '4']);
    expect(results(out)).toEqual([INVALID, GOODBYE]);
  });

  test('TC-006 multi-digit choice uses only the first digit', async () => {
    const out = await run(['12', '4']);
    expect(results(out)).toEqual(['Current balance: 001000.00', GOODBYE]);
  });
});

describe('View balance (OPS/DATA)', () => {
  test('TC-007 initial balance is 1000.00', async () => {
    expect(results(await run(['1', '4']))).toContain('Current balance: 001000.00');
  });

  test('TC-008 viewing the balance does not change it', async () => {
    const r = results(await run(['1', '1', '4']));
    expect(r.filter((l) => l === 'Current balance: 001000.00')).toHaveLength(2);
  });
});

describe('Credit (OPS)', () => {
  test('TC-009 credit a whole-number amount', async () => {
    expect(results(await run(['2', '100', '4']))).toContain(
      'Amount credited. New balance: 001100.00'
    );
  });

  test('TC-010 credit an amount with decimals', async () => {
    expect(results(await run(['2', '10.25', '4']))).toContain(
      'Amount credited. New balance: 001010.25'
    );
  });

  test('TC-011 credited amount is persisted', async () => {
    const r = results(await run(['2', '100', '1', '4']));
    expect(r).toContain('Current balance: 001100.00');
  });

  test('TC-012 consecutive credits accumulate', async () => {
    const r = results(await run(['2', '100', '2', '50.50', '1', '4']));
    expect(r).toEqual([
      'Amount credited. New balance: 001100.00',
      'Amount credited. New balance: 001150.50',
      'Current balance: 001150.50',
      GOODBYE,
    ]);
  });

  test('TC-013 credit of zero leaves the balance unchanged', async () => {
    expect(results(await run(['2', '0', '4']))).toContain(
      'Amount credited. New balance: 001000.00'
    );
  });
});

describe('Debit (OPS)', () => {
  test('TC-014 debit a whole-number amount', async () => {
    expect(results(await run(['3', '50', '4']))).toContain(
      'Amount debited. New balance: 000950.00'
    );
  });

  test('TC-015 debit an amount with decimals', async () => {
    expect(results(await run(['3', '10.25', '4']))).toContain(
      'Amount debited. New balance: 000989.75'
    );
  });

  test('TC-016 debited amount is persisted', async () => {
    expect(results(await run(['3', '50', '1', '4']))).toContain('Current balance: 000950.00');
  });

  test('TC-017 debit equal to the balance is allowed', async () => {
    const r = results(await run(['3', '1000', '1', '4']));
    expect(r).toEqual([
      'Amount debited. New balance: 000000.00',
      'Current balance: 000000.00',
      GOODBYE,
    ]);
  });

  test('TC-018 debit exceeding the balance is rejected', async () => {
    const r = results(await run(['3', '1000.01', '4']));
    expect(r).toEqual([INSUFFICIENT, GOODBYE]);
  });

  test('TC-019 rejected debit leaves the balance unchanged', async () => {
    const r = results(await run(['3', '5000', '1', '4']));
    expect(r).toEqual([INSUFFICIENT, 'Current balance: 001000.00', GOODBYE]);
  });

  test('TC-020 debit when the balance is zero is rejected', async () => {
    const r = results(await run(['3', '1000', '3', '0.01', '4']));
    expect(r).toEqual(['Amount debited. New balance: 000000.00', INSUFFICIENT, GOODBYE]);
  });

  test('TC-021 credit after the balance reaches zero', async () => {
    const r = results(await run(['3', '1000', '2', '0.50', '1', '4']));
    expect(r).toEqual([
      'Amount debited. New balance: 000000.00',
      'Amount credited. New balance: 000000.50',
      'Current balance: 000000.50',
      GOODBYE,
    ]);
  });

  test('TC-022 debit of zero leaves the balance unchanged', async () => {
    expect(results(await run(['3', '0', '4']))).toContain(
      'Amount debited. New balance: 001000.00'
    );
  });
});

describe('Integration and data lifetime', () => {
  test('TC-023 mixed sequence of transactions', async () => {
    const r = results(await run(['2', '100', '3', '50', '3', '5000', '1', '4']));
    expect(r).toEqual([
      'Amount credited. New balance: 001100.00',
      'Amount debited. New balance: 001050.00',
      INSUFFICIENT,
      'Current balance: 001050.00',
      GOODBYE,
    ]);
  });

  test('TC-024 balance resets on each application start', async () => {
    await run(['2', '100', '4']);
    resetStorage(); // simulates restarting the app
    expect(results(await run(['1', '4']))).toContain('Current balance: 001000.00');
  });

  test('DataProgram READ/WRITE round trip', () => {
    expect(dataProgram('READ')).toBe(100000);
    dataProgram('WRITE', 12345);
    expect(dataProgram('READ')).toBe(12345);
  });

  test('operations() handles the TOTAL, CREDIT and DEBIT codes directly', async () => {
    const out = [];
    const io = { print: (l) => out.push(l), prompt: async () => '10' };
    await operations('CREDIT', io);
    await operations('DEBIT ', io);
    await operations('TOTAL ', io);
    expect(out).toEqual([
      'Amount credited. New balance: 001010.00',
      'Amount debited. New balance: 001000.00',
      'Current balance: 001000.00',
    ]);
  });
});

describe('Legacy input and numeric-limit behavior (⚠)', () => {
  test('TC-025 negative credit loses its sign', async () => {
    expect(results(await run(['2', '-50', '4']))).toContain(
      'Amount credited. New balance: 001050.00'
    );
  });

  test('TC-026 negative debit loses its sign', async () => {
    expect(results(await run(['3', '-50', '4']))).toContain(
      'Amount debited. New balance: 000950.00'
    );
  });

  test('TC-027 non-numeric amount is treated as 0', async () => {
    expect(results(await run(['2', 'abc', '4']))).toContain(
      'Amount credited. New balance: 001000.00'
    );
  });

  test('TC-028 more than two decimals are truncated, not rounded', async () => {
    expect(results(await run(['2', '1.239', '4']))).toContain(
      'Amount credited. New balance: 001001.23'
    );
  });

  test('TC-029 credit exceeding the maximum drops the high-order digit', async () => {
    expect(results(await run(['2', '999999', '4']))).toContain(
      'Amount credited. New balance: 000999.00'
    );
  });

  test('TC-030 maximum representable balance', async () => {
    const r = results(await run(['2', '998999.9', '1', '4']));
    expect(r).toEqual([
      'Amount credited. New balance: 999999.90',
      'Current balance: 999999.90',
      GOODBYE,
    ]);
  });

  test('TC-031 amount input longer than 8 characters is truncated', async () => {
    expect(results(await run(['2', '998999.99', '4']))).toContain(
      'Amount credited. New balance: 999999.90'
    );
  });
});

describe('Helpers', () => {
  test('formatBalance pads to NNNNNN.NN', () => {
    expect(formatBalance(0)).toBe('000000.00');
    expect(formatBalance(100005)).toBe('001000.05');
    expect(formatBalance(99999999)).toBe('999999.99');
  });

  test.each([
    ['100', 10000],
    ['10.25', 1025],
    ['.5', 50],
    ['abc', 0],
    ['-50', 5000],
    ['1.239', 123],
    ['', 0],
  ])('parseAmount(%j) -> %i cents', (text, cents) => {
    expect(parseAmount(text)).toBe(cents);
  });
});
