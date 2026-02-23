import { CompositeStrategy } from '../strategies/CompositeStrategy';
import { Bid } from '../BidRankingStrategy';

describe('CompositeStrategy (expanded)', () => {
  let strategy: CompositeStrategy;

  beforeEach(() => {
    strategy = new CompositeStrategy();
  });

  // Formula: score = (1/proposed_rate) * 0.4 + rating * 0.6
  // Higher score = better rank (sorted descending by score)

  it('ranks by combined weighted score (rating 60%, inverse-price 40%)', () => {
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 4.0 } },
      { proposed_rate: 50, freelancer: { rating: 3.5 } },
      { proposed_rate: 80, freelancer: { rating: 4.5 } },
    ];

    // score(100, 4.0) = (1/100)*0.4 + 4.0*0.6 = 0.004 + 2.4   = 2.404
    // score(50, 3.5)  = (1/50)*0.4  + 3.5*0.6 = 0.008 + 2.1   = 2.108
    // score(80, 4.5)  = (1/80)*0.4  + 4.5*0.6 = 0.005 + 2.7   = 2.705
    // Order: 80 (2.705) > 100 (2.404) > 50 (2.108)

    const result = strategy.rank(bids);
    expect(result.map((b) => b.proposed_rate)).toEqual([80, 100, 50]);
  });

  it('returns empty array for empty input', () => {
    expect(strategy.rank([])).toEqual([]);
  });

  it('returns single element unchanged', () => {
    const bids: Bid[] = [{ proposed_rate: 100, freelancer: { rating: 4.0 } }];
    const result = strategy.rank(bids);
    expect(result).toEqual(bids);
  });

  it('handles two bids with exact scores computed manually', () => {
    // Bid A: rate=200, rating=5.0 → score = (1/200)*0.4 + 5.0*0.6 = 0.002 + 3.0 = 3.002
    // Bid B: rate=100, rating=4.0 → score = (1/100)*0.4 + 4.0*0.6 = 0.004 + 2.4 = 2.404
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 4.0 } },
      { proposed_rate: 200, freelancer: { rating: 5.0 } },
    ];

    const result = strategy.rank(bids);
    // Bid B (rate=200, rating=5.0) has higher score 3.002 > 2.404
    expect(result[0].proposed_rate).toBe(200);
    expect(result[1].proposed_rate).toBe(100);
  });

  it('does not mutate the original array', () => {
    const bids: Bid[] = [
      { proposed_rate: 300, freelancer: { rating: 3.0 } },
      { proposed_rate: 100, freelancer: { rating: 5.0 } },
    ];
    const originalOrder = [...bids];

    strategy.rank(bids);

    expect(bids[0]).toBe(originalOrder[0]);
    expect(bids[1]).toBe(originalOrder[1]);
  });

  it('higher rating dominates when prices are similar', () => {
    // rate=100, rating=5.0 → score = 0.004 + 3.0 = 3.004
    // rate=100, rating=3.0 → score = 0.004 + 1.8 = 1.804
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 3.0 } },
      { proposed_rate: 100, freelancer: { rating: 5.0 } },
    ];

    const result = strategy.rank(bids);
    expect(result[0].freelancer.rating).toBe(5.0);
  });

  it('much lower price can compensate for lower rating', () => {
    // rate=10,  rating=1.0 → score = (1/10)*0.4  + 1.0*0.6 = 0.04  + 0.6 = 0.64
    // rate=500, rating=1.0 → score = (1/500)*0.4 + 1.0*0.6 = 0.0008 + 0.6 = 0.6008
    const bids: Bid[] = [
      { proposed_rate: 500, freelancer: { rating: 1.0 } },
      { proposed_rate: 10, freelancer: { rating: 1.0 } },
    ];

    const result = strategy.rank(bids);
    expect(result[0].proposed_rate).toBe(10);
  });
});
