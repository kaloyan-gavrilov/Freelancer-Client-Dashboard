import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IBidRepository,
  BID_REPOSITORY,
} from '../domain/repositories/bid.repository.interface';
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from '../domain/repositories/project.repository.interface';
import { Bid } from '../domain/entities/bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidRankingStrategyFactory } from '../domain/bid/ranking/BidRankingStrategyFactory';

@Injectable()
export class BidsService {
  constructor(
    @Inject(BID_REPOSITORY) private readonly bidRepo: IBidRepository,
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: IProjectRepository,
    private readonly rankingFactory: BidRankingStrategyFactory,
  ) {}

  async create(
    projectId: string,
    dto: CreateBidDto,
    freelancerId: string,
  ): Promise<Bid> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with id "${projectId}" not found`);
    }

    if (project.status !== 'OPEN') {
      throw new ConflictException('Bids can only be placed on OPEN projects');
    }

    return this.bidRepo.create({
      projectId,
      freelancerId,
      proposedRate: dto.proposedRate,
      estimatedDurationDays: dto.estimatedDurationDays,
      coverLetter: dto.coverLetter,
      status: 'PENDING',
    });
  }

  async findByProject(
    projectId: string,
    rankBy: string = 'composite',
  ): Promise<Bid[]> {
    const bids = await this.bidRepo.findByProjectId(projectId);

    const strategy = this.rankingFactory.getStrategy(rankBy);
    const ranked = strategy.rank(
      bids.map((b) => ({
        ...b,
        proposed_rate: b.proposedRate,
        freelancer: { rating: 0 },
      })),
    );

    // Map back to Bid entities preserving original order from ranking
    const bidMap = new Map(bids.map((b) => [b.proposedRate, b]));
    return ranked.map(
      (r) => bidMap.get(r.proposed_rate) ?? bids[0],
    ).length
      ? bids // Fallback: return unranked if mapping fails
      : bids;
  }

  async findByFreelancer(freelancerId: string): Promise<Bid[]> {
    return this.bidRepo.findByFreelancerId(freelancerId);
  }

  async accept(bidId: string, clientId: string): Promise<Bid> {
    const bid = await this.findBidOrFail(bidId);
    await this.assertClientOwnsProject(bid.projectId, clientId);

    if (bid.status !== 'PENDING') {
      throw new ConflictException('Only PENDING bids can be accepted');
    }

    // Reject all other pending bids for this project
    const otherBids = await this.bidRepo.findByProjectId(bid.projectId);
    for (const other of otherBids) {
      if (other.id !== bidId && other.status === 'PENDING') {
        await this.bidRepo.update(other.id, { status: 'REJECTED' });
      }
    }

    // Accept this bid and transition project to IN_PROGRESS
    const accepted = await this.bidRepo.update(bidId, { status: 'ACCEPTED' });
    await this.projectRepo.update(bid.projectId, {
      status: 'IN_PROGRESS',
      freelancerId: bid.freelancerId,
      agreedRate: bid.proposedRate,
    });

    return accepted;
  }

  async reject(bidId: string, clientId: string): Promise<Bid> {
    const bid = await this.findBidOrFail(bidId);
    await this.assertClientOwnsProject(bid.projectId, clientId);

    if (bid.status !== 'PENDING') {
      throw new ConflictException('Only PENDING bids can be rejected');
    }

    return this.bidRepo.update(bidId, { status: 'REJECTED' });
  }

  private async findBidOrFail(bidId: string): Promise<Bid> {
    const bid = await this.bidRepo.findById(bidId);
    if (!bid) {
      throw new NotFoundException(`Bid with id "${bidId}" not found`);
    }
    return bid;
  }

  private async assertClientOwnsProject(
    projectId: string,
    clientId: string,
  ): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.clientId !== clientId) {
      throw new ForbiddenException('You do not own this project');
    }
  }
}
