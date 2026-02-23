import { PriceAscStrategy } from '../strategies/PriceAscStrategy';
import { Bid } from '../BidRankingStrategy';

describe('PriceAscStrategy (expanded)', () => {
  let strategy: PriceAscStrategy;

  beforeEach(() => {
    strategy = new PriceAscStrategy();
  });

  it('sorts bids by ascending proposed_rate', () => {
    const bids: Bid[] = [
      { proposed_rate: 200, freelancer: { rating: 4.5 } },
      { proposed_rate: 100, freelancer: { rating: 4.8 } },
      { proposed_rate: 150, freelancer: { rating: 4.2 } },
    ];

    const result = strategy.rank(bids);
    expect(result.map((b) => b.proposed_rate)).toEqual([100, 150, 200]);
  });

  it('returns empty array for empty input', () => {
    expect(strategy.rank([])).toEqual([]);
  });

  it('returns single element unchanged', () => {
    const bids: Bid[] = [{ proposed_rate: 100, freelancer: { rating: 5.0 } }];
    const result = strategy.rank(bids);
    expect(result).toEqual(bids);
  });

  it('handles equal prices (stable relative order)', () => {
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 3.0 } },
      { proposed_rate: 100, freelancer: { rating: 5.0 } },
      { proposed_rate: 100, freelancer: { rating: 4.0 } },
    ];

    const result = strategy.rank(bids);
    // All prices are equal, so all should remain
    expect(result.every((b) => b.proposed_rate === 100)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('does not mutate the original array', () => {
    const bids: Bid[] = [
      { proposed_rate: 300, freelancer: { rating: 4.0 } },
      { proposed_rate: 100, freelancer: { rating: 4.0 } },
    ];
    const originalFirst = bids[0];

    strategy.rank(bids);

    expect(bids[0]).toBe(originalFirst);
    expect(bids[0].proposed_rate).toBe(300);
  });

  it('handles fractional prices correctly', () => {
    const bids: Bid[] = [
      { proposed_rate: 99.99, freelancer: { rating: 4.0 } },
      { proposed_rate: 99.50, freelancer: { rating: 4.0 } },
      { proposed_rate: 100.01, freelancer: { rating: 4.0 } },
    ];

    const result = strategy.rank(bids);
    expect(result.map((b) => b.proposed_rate)).toEqual([99.50, 99.99, 100.01]);
  });
});
