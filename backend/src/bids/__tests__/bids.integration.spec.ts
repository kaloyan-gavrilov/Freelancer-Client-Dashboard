import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { BidsController } from '../bids.controller';
import { BidsService } from '../bids.service';
import { BID_REPOSITORY } from '../../domain/repositories/bid.repository.interface';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { BidRankingStrategyFactory } from '../../domain/bid/ranking/BidRankingStrategyFactory';
import { PriceAscStrategy } from '../../domain/bid/ranking/strategies/PriceAscStrategy';
import { RatingDescStrategy } from '../../domain/bid/ranking/strategies/RatingDescStrategy';
import { CompositeStrategy } from '../../domain/bid/ranking/strategies/CompositeStrategy';
import { Bid } from '../../domain/entities/bid.entity';
import { Project } from '../../domain/entities/project.entity';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../domain/user/user-role.enum';

// ── Configurable mock user ─────────────────────────────────────────────
let mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockUser;
    return true;
  }
}

// ── In-memory stores ───────────────────────────────────────────────────
const projectsStore = new Map<string, Project>();
const bidsStore = new Map<string, Bid>();
let bidIdCounter = 0;

const openProject: Project = {
  id: 'project-1',
  clientId: 'client-1',
  freelancerId: null,
  title: 'Open Project',
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

const draftProject: Project = {
  ...openProject,
  id: 'project-draft',
  status: 'DRAFT',
};

const inMemoryProjectRepo = {
  findById: jest.fn(async (id: string) => projectsStore.get(id) ?? null),
  findByClientId: jest.fn(async () => []),
  findByFreelancerId: jest.fn(async () => []),
  findByStatus: jest.fn(async () => []),
  create: jest.fn(),
  update: jest.fn(async (id: string, data: Partial<Project>) => {
    const existing = projectsStore.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    projectsStore.set(id, updated);
    return updated;
  }),
  delete: jest.fn(),
};

const inMemoryBidRepo = {
  findById: jest.fn(async (id: string) => bidsStore.get(id) ?? null),
  findByProjectId: jest.fn(async (projectId: string) =>
    [...bidsStore.values()].filter((b) => b.projectId === projectId),
  ),
  findByFreelancerId: jest.fn(async () => []),
  findByStatus: jest.fn(async () => []),
  create: jest.fn(async (data: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `bid-${++bidIdCounter}`;
    const bid: Bid = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    bidsStore.set(id, bid);
    return bid;
  }),
  update: jest.fn(async (id: string, data: Partial<Bid>) => {
    const existing = bidsStore.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    bidsStore.set(id, updated);
    return updated;
  }),
  delete: jest.fn(),
};

describe('Bids Integration (Supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BidsController],
      providers: [
        BidsService,
        BidRankingStrategyFactory,
        PriceAscStrategy,
        RatingDescStrategy,
        CompositeStrategy,
        { provide: BID_REPOSITORY, useValue: inMemoryBidRepo },
        { provide: PROJECT_REPOSITORY, useValue: inMemoryProjectRepo },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalGuards(new MockAuthGuard(), new RolesGuard(app.get(Reflector)));
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  beforeEach(() => {
    bidsStore.clear();
    bidIdCounter = 0;
    projectsStore.clear();
    projectsStore.set('project-1', { ...openProject });
    projectsStore.set('project-draft', { ...draftProject });
    mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /projects/:id/bids ──────────────────────────────────────────

  describe('POST /projects/:id/bids', () => {
    const validBid = {
      proposedRate: 75.5,
      estimatedDurationDays: 30,
      coverLetter: 'I have 5 years of experience building e-commerce platforms.',
    };

    it('201 — freelancer places a bid on OPEN project', async () => {
      mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };

      const res = await request(app.getHttpServer())
        .post('/projects/project-1/bids')
        .send(validBid)
        .expect(201);

      expect(res.body).toMatchObject({
        projectId: 'project-1',
        freelancerId: 'freelancer-1',
        status: 'PENDING',
        proposedRate: 75.5,
      });
    });

    it('403 — client cannot place a bid (FREELANCER role required)', async () => {
      mockUser = { id: 'client-1', email: 'c@test.com', role: UserRole.CLIENT };

      await request(app.getHttpServer())
        .post('/projects/project-1/bids')
        .send(validBid)
        .expect(403);
    });

    it('409 — cannot bid on non-OPEN project', async () => {
      mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };

      await request(app.getHttpServer())
        .post('/projects/project-draft/bids')
        .send(validBid)
        .expect(409);
    });

    it('404 — project does not exist', async () => {
      mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };

      await request(app.getHttpServer())
        .post('/projects/nonexistent/bids')
        .send(validBid)
        .expect(404);
    });

    it('400 — missing required field (coverLetter)', async () => {
      const { coverLetter, ...incomplete } = validBid;

      await request(app.getHttpServer())
        .post('/projects/project-1/bids')
        .send(incomplete)
        .expect(400);
    });
  });

  // ── PATCH /bids/:id/accept ───────────────────────────────────────────

  describe('PATCH /bids/:id/accept', () => {
    it('200 — client accepts a PENDING bid', async () => {
      // Create bid as freelancer
      mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };
      const bidRes = await request(app.getHttpServer())
        .post('/projects/project-1/bids')
        .send({
          proposedRate: 75.5,
          estimatedDurationDays: 30,
          coverLetter: 'Experienced developer.',
        });

      // Accept as client
      mockUser = { id: 'client-1', email: 'c@test.com', role: UserRole.CLIENT };

      const res = await request(app.getHttpServer())
        .patch(`/bids/${bidRes.body.id}/accept`)
        .expect(200);

      expect(res.body.status).toBe('ACCEPTED');
    });

    it('403 — freelancer cannot accept bids (CLIENT role required)', async () => {
      // Create bid
      mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };
      const bidRes = await request(app.getHttpServer())
        .post('/projects/project-1/bids')
        .send({
          proposedRate: 80,
          estimatedDurationDays: 25,
          coverLetter: 'Test.',
        });

      // Try to accept as freelancer (should be rejected)
      await request(app.getHttpServer())
        .patch(`/bids/${bidRes.body.id}/accept`)
        .expect(403);
    });
  });

  // ── PATCH /bids/:id/reject ───────────────────────────────────────────

  describe('PATCH /bids/:id/reject', () => {
    it('200 — client rejects a PENDING bid', async () => {
      mockUser = { id: 'freelancer-1', email: 'f@test.com', role: UserRole.FREELANCER };
      const bidRes = await request(app.getHttpServer())
        .post('/projects/project-1/bids')
        .send({
          proposedRate: 90,
          estimatedDurationDays: 20,
          coverLetter: 'Senior dev.',
        });

      mockUser = { id: 'client-1', email: 'c@test.com', role: UserRole.CLIENT };

      const res = await request(app.getHttpServer())
        .patch(`/bids/${bidRes.body.id}/reject`)
        .expect(200);

      expect(res.body.status).toBe('REJECTED');
    });
  });
});
