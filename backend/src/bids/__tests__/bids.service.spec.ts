import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { BidsService } from '../bids.service';
import { BID_REPOSITORY } from '../../domain/repositories/bid.repository.interface';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { BidRankingStrategyFactory } from '../../domain/bid/ranking/BidRankingStrategyFactory';
import { Bid } from '../../domain/entities/bid.entity';
import { Project } from '../../domain/entities/project.entity';

const mockProject: Project = {
  id: 'project-1',
  clientId: 'client-1',
  freelancerId: null,
  title: 'Test Project',
  description: 'Test',
  budgetMin: 1000,
  budgetMax: 5000,
  deadline: new Date('2026-06-01'),
  status: 'OPEN',
  projectType: 'FIXED',
  agreedRate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBid: Bid = {
  id: 'bid-1',
  projectId: 'project-1',
  freelancerId: 'freelancer-1',
  proposedRate: 75.5,
  estimatedDurationDays: 30,
  coverLetter: 'I am qualified...',
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBidRepo = {
  findById: jest.fn(),
  findByProjectId: jest.fn(),
  findByFreelancerId: jest.fn(),
  findByStatus: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectRepo = {
  findById: jest.fn(),
  findByClientId: jest.fn(),
  findByFreelancerId: jest.fn(),
  findByStatus: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockRankingFactory = {
  getStrategy: jest.fn().mockReturnValue({
    rank: jest.fn((bids: unknown[]) => bids),
  }),
};

describe('BidsService', () => {
  let service: BidsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidsService,
        { provide: BID_REPOSITORY, useValue: mockBidRepo },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepo },
        { provide: BidRankingStrategyFactory, useValue: mockRankingFactory },
      ],
    }).compile();

    service = module.get<BidsService>(BidsService);
  });

  // ── create ───────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a bid on an OPEN project', async () => {
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockBidRepo.create.mockResolvedValue(mockBid);

      const result = await service.create(
        'project-1',
        { proposedRate: 75.5, estimatedDurationDays: 30, coverLetter: 'I am qualified...' },
        'freelancer-1',
      );

      expect(mockBidRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          freelancerId: 'freelancer-1',
          status: 'PENDING',
        }),
      );
      expect(result).toEqual(mockBid);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(
          'nonexistent',
          { proposedRate: 75.5, estimatedDurationDays: 30, coverLetter: 'test' },
          'freelancer-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when project is not OPEN', async () => {
      mockProjectRepo.findById.mockResolvedValue({ ...mockProject, status: 'DRAFT' });

      await expect(
        service.create(
          'project-1',
          { proposedRate: 75.5, estimatedDurationDays: 30, coverLetter: 'test' },
          'freelancer-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── accept ───────────────────────────────────────────────────────────

  describe('accept()', () => {
    it('accepts a PENDING bid and rejects others', async () => {
      const otherBid: Bid = { ...mockBid, id: 'bid-2', freelancerId: 'freelancer-2' };
      mockBidRepo.findById.mockResolvedValue(mockBid);
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockBidRepo.findByProjectId.mockResolvedValue([mockBid, otherBid]);
      mockBidRepo.update.mockImplementation(
        async (id: string, data: Partial<Bid>) =>
          ({ ...mockBid, id, ...data } as Bid),
      );
      mockProjectRepo.update.mockResolvedValue({
        ...mockProject,
        status: 'IN_PROGRESS',
      });

      const result = await service.accept('bid-1', 'client-1');

      expect(result.status).toBe('ACCEPTED');
      // Other bid should be rejected
      expect(mockBidRepo.update).toHaveBeenCalledWith('bid-2', { status: 'REJECTED' });
    });

    it('throws ConflictException for non-PENDING bid', async () => {
      mockBidRepo.findById.mockResolvedValue({ ...mockBid, status: 'REJECTED' });
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      await expect(service.accept('bid-1', 'client-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ForbiddenException when client does not own project', async () => {
      mockBidRepo.findById.mockResolvedValue(mockBid);
      mockProjectRepo.findById.mockResolvedValue({
        ...mockProject,
        clientId: 'other-client',
      });

      await expect(service.accept('bid-1', 'client-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when bid does not exist', async () => {
      mockBidRepo.findById.mockResolvedValue(null);

      await expect(service.accept('nonexistent', 'client-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── reject ───────────────────────────────────────────────────────────

  describe('reject()', () => {
    it('rejects a PENDING bid', async () => {
      mockBidRepo.findById.mockResolvedValue(mockBid);
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockBidRepo.update.mockResolvedValue({ ...mockBid, status: 'REJECTED' });

      const result = await service.reject('bid-1', 'client-1');

      expect(result.status).toBe('REJECTED');
    });

    it('throws ConflictException for non-PENDING bid', async () => {
      mockBidRepo.findById.mockResolvedValue({ ...mockBid, status: 'ACCEPTED' });
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      await expect(service.reject('bid-1', 'client-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
