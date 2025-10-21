import { describe, it, expect } from 'vitest';

// Simple, isolated example unit tests (placeholder for real ones)
function calcTotal(items: Array<{ price: number; qty: number }>) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}

describe('calcTotal', () => {
  it('sums price x qty', () => {
    expect(calcTotal([{ price: 10, qty: 2 }, { price: 5.5, qty: 3 }])).toBe(10*2 + 5.5*3);
  });
  it('handles empty', () => {
    expect(calcTotal([])).toBe(0);
  });
});
