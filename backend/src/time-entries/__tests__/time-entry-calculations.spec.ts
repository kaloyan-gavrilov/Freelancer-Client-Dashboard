/**
 * Financial calculation tests for time entries.
 *
 * The TimeEntriesService stores hours and the project stores an agreedRate.
 * The total cost is: agreedRate × hours.
 * These tests verify the calculation with exact values (no floating-point approximations).
 */

describe('Time Entry Financial Calculations', () => {
  /**
   * Pure calculation function matching the business rule:
   * total = hourlyRate × hours
   */
  function calculateTotal(hourlyRate: number, hours: number): number {
    return Math.round(hourlyRate * hours * 100) / 100;
  }

  // ── Basic calculations ───────────────────────────────────────────────

  describe('calculateTotal(hourlyRate, hours)', () => {
    it('calculates whole hours correctly', () => {
      // $75/hr × 8 hours = $600.00
      expect(calculateTotal(75, 8)).toBe(600);
    });

    it('calculates fractional hours correctly', () => {
      // $100/hr × 4.5 hours = $450.00
      expect(calculateTotal(100, 4.5)).toBe(450);
    });

    it('returns 0 for 0 hours', () => {
      expect(calculateTotal(100, 0)).toBe(0);
    });

    it('returns 0 for 0 hourly rate', () => {
      expect(calculateTotal(0, 8)).toBe(0);
    });

    it('returns 0 when both are 0', () => {
      expect(calculateTotal(0, 0)).toBe(0);
    });

    it('handles small fractional hours (0.25 = 15 minutes)', () => {
      // $80/hr × 0.25 hours = $20.00
      expect(calculateTotal(80, 0.25)).toBe(20);
    });

    it('handles small fractional hours (0.1 = 6 minutes)', () => {
      // $50/hr × 0.1 hours = $5.00
      expect(calculateTotal(50, 0.1)).toBe(5);
    });

    it('handles fractional rate with fractional hours', () => {
      // $75.50/hr × 2.5 hours = $188.75
      expect(calculateTotal(75.5, 2.5)).toBe(188.75);
    });

    it('rounds to 2 decimal places to avoid floating point drift', () => {
      // $33.33/hr × 3 hours = $99.99 (not 99.99000000000001)
      expect(calculateTotal(33.33, 3)).toBe(99.99);
    });

    it('handles the classic 0.1 + 0.2 floating point case', () => {
      // $0.10/hr × 2 hours = $0.20 (not 0.20000000000000004)
      expect(calculateTotal(0.1, 2)).toBe(0.2);
    });

    it('large values: $250/hr × 160 hours (full month)', () => {
      expect(calculateTotal(250, 160)).toBe(40000);
    });

    it('large fractional: $199.99/hr × 7.75 hours', () => {
      // 199.99 × 7.75 = 1549.9225 → rounded to 1549.92
      expect(calculateTotal(199.99, 7.75)).toBe(1549.92);
    });
  });

  // ── Aggregating multiple entries ─────────────────────────────────────

  describe('aggregating multiple time entries', () => {
    function sumTotals(entries: { rate: number; hours: number }[]): number {
      const sum = entries.reduce(
        (acc, e) => acc + calculateTotal(e.rate, e.hours),
        0,
      );
      return Math.round(sum * 100) / 100;
    }

    it('sums multiple entries for a project', () => {
      const entries = [
        { rate: 75, hours: 4 },    // 300.00
        { rate: 75, hours: 3.5 },  // 262.50
        { rate: 75, hours: 2 },    // 150.00
      ];
      expect(sumTotals(entries)).toBe(712.5);
    });

    it('handles empty entries list', () => {
      expect(sumTotals([])).toBe(0);
    });

    it('single entry equals individual calculation', () => {
      const entries = [{ rate: 100, hours: 5 }];
      expect(sumTotals(entries)).toBe(calculateTotal(100, 5));
    });
  });
});
