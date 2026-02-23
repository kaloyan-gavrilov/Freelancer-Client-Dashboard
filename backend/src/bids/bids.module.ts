import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { BidRankingStrategyFactory } from '../domain/bid/ranking/BidRankingStrategyFactory';
import { PriceAscStrategy } from '../domain/bid/ranking/strategies/PriceAscStrategy';
import { RatingDescStrategy } from '../domain/bid/ranking/strategies/RatingDescStrategy';
import { CompositeStrategy } from '../domain/bid/ranking/strategies/CompositeStrategy';

@Module({
  imports: [RepositoriesModule],
  controllers: [BidsController],
  providers: [
    BidsService,
    BidRankingStrategyFactory,
    PriceAscStrategy,
    RatingDescStrategy,
    CompositeStrategy,
  ],
})
export class BidsModule {}
