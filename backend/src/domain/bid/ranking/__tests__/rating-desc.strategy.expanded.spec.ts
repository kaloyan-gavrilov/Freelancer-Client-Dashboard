import { RatingDescStrategy } from '../strategies/RatingDescStrategy';
import { Bid } from '../BidRankingStrategy';

describe('RatingDescStrategy (expanded)', () => {
  let strategy: RatingDescStrategy;

  beforeEach(() => {
    strategy = new RatingDescStrategy();
  });

  it('sorts bids by descending freelancer rating', () => {
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 4.2 } },
      { proposed_rate: 120, freelancer: { rating: 4.9 } },
      { proposed_rate: 110, freelancer: { rating: 4.5 } },
    ];

    const result = strategy.rank(bids);
    expect(result.map((b) => b.freelancer.rating)).toEqual([4.9, 4.5, 4.2]);
  });

  it('returns empty array for empty input', () => {
    expect(strategy.rank([])).toEqual([]);
  });

  it('returns single element unchanged', () => {
    const bids: Bid[] = [{ proposed_rate: 100, freelancer: { rating: 3.0 } }];
    const result = strategy.rank(bids);
    expect(result).toEqual(bids);
  });

  it('handles equal ratings', () => {
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 4.5 } },
      { proposed_rate: 200, freelancer: { rating: 4.5 } },
      { proposed_rate: 150, freelancer: { rating: 4.5 } },
    ];

    const result = strategy.rank(bids);
    expect(result.every((b) => b.freelancer.rating === 4.5)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('does not mutate the original array', () => {
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 3.0 } },
      { proposed_rate: 200, freelancer: { rating: 5.0 } },
    ];
    const originalFirst = bids[0];

    strategy.rank(bids);

    expect(bids[0]).toBe(originalFirst);
    expect(bids[0].freelancer.rating).toBe(3.0);
  });

  it('handles zero rating', () => {
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 0 } },
      { proposed_rate: 200, freelancer: { rating: 4.5 } },
      { proposed_rate: 150, freelancer: { rating: 2.0 } },
    ];

    const result = strategy.rank(bids);
    expect(result.map((b) => b.freelancer.rating)).toEqual([4.5, 2.0, 0]);
  });

  it('handles maximum rating of 5.0', () => {
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 5.0 } },
      { proposed_rate: 200, freelancer: { rating: 4.99 } },
    ];

    const result = strategy.rank(bids);
    expect(result[0].freelancer.rating).toBe(5.0);
    expect(result[1].freelancer.rating).toBe(4.99);
  });
});
