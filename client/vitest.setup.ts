import '@testing-library/jest-dom';
import { beforeAll, afterAll } from 'vitest';

// Silence noisy console during tests (opt-in)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    const msg = args?.[0] || '';
    if (typeof msg === 'string' && (msg.includes('Warning:')))
      return;
    originalError.apply(console, args);
  };
});
afterAll(() => { console.error = originalError; });
