import { BidRankingStrategyFactory } from '../BidRankingStrategyFactory';
import { PriceAscStrategy } from '../strategies/PriceAscStrategy';
import { RatingDescStrategy } from '../strategies/RatingDescStrategy';
import { CompositeStrategy } from '../strategies/CompositeStrategy';

describe('BidRankingStrategyFactory', () => {
  let factory: BidRankingStrategyFactory;
  let priceStrategy: PriceAscStrategy;
  let ratingStrategy: RatingDescStrategy;
  let compositeStrategy: CompositeStrategy;

  beforeEach(() => {
    priceStrategy = new PriceAscStrategy();
    ratingStrategy = new RatingDescStrategy();
    compositeStrategy = new CompositeStrategy();
    factory = new BidRankingStrategyFactory(priceStrategy, ratingStrategy, compositeStrategy);
  });

  it('returns PriceAscStrategy for "price"', () => {
    expect(factory.getStrategy('price')).toBe(priceStrategy);
  });

  it('returns RatingDescStrategy for "rating"', () => {
    expect(factory.getStrategy('rating')).toBe(ratingStrategy);
  });

  it('returns CompositeStrategy for "composite"', () => {
    expect(factory.getStrategy('composite')).toBe(compositeStrategy);
  });

  it('defaults to CompositeStrategy for unknown type', () => {
    expect(factory.getStrategy('unknown')).toBe(compositeStrategy);
  });

  it('defaults to CompositeStrategy for empty string', () => {
    expect(factory.getStrategy('')).toBe(compositeStrategy);
  });
});
