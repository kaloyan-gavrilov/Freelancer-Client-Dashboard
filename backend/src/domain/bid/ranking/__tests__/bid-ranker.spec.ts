import { BidRanker } from '../BidRanker';
import { BidRankingStrategy, Bid } from '../BidRankingStrategy';

describe('BidRanker', () => {
  it('delegates ranking to the injected strategy', () => {
    const mockStrategy: BidRankingStrategy = {
      rank: jest.fn((bids: Bid[]) => [...bids].reverse()),
    };

    const ranker = new BidRanker(mockStrategy);
    const bids: Bid[] = [
      { proposed_rate: 100, freelancer: { rating: 4.0 } },
      { proposed_rate: 200, freelancer: { rating: 4.5 } },
    ];

    const result = ranker.rankBids(bids);

    expect(mockStrategy.rank).toHaveBeenCalledTimes(1);
    expect(mockStrategy.rank).toHaveBeenCalledWith(bids);
    expect(result[0].proposed_rate).toBe(200);
    expect(result[1].proposed_rate).toBe(100);
  });

  it('works with any strategy implementation without knowing the concrete type', () => {
    // A completely custom strategy that sorts alphabetically by... nothing meaningful
    // The point is BidRanker doesn't care about the strategy internals
    const customStrategy: BidRankingStrategy = {
      rank: jest.fn((bids: Bid[]) => bids),
    };

    const ranker = new BidRanker(customStrategy);
    const bids: Bid[] = [
      { proposed_rate: 50, freelancer: { rating: 3.0 } },
    ];

    const result = ranker.rankBids(bids);

    expect(customStrategy.rank).toHaveBeenCalledWith(bids);
    expect(result).toEqual(bids);
  });

  it('returns empty array when given empty input', () => {
    const mockStrategy: BidRankingStrategy = {
      rank: jest.fn((bids: Bid[]) => bids),
    };

    const ranker = new BidRanker(mockStrategy);
    const result = ranker.rankBids([]);

    expect(result).toEqual([]);
    expect(mockStrategy.rank).toHaveBeenCalledWith([]);
  });
});
