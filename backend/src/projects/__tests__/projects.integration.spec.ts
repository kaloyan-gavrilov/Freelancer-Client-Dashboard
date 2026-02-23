import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { Project } from '../../domain/entities/project.entity';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../domain/user/user-role.enum';

// ── Configurable mock user ─────────────────────────────────────────────
let mockUser = { id: 'client-1', email: 'client@test.com', role: UserRole.CLIENT };

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = mockUser;
    return true;
  }
}

// ── In-memory project store ────────────────────────────────────────────
const projects = new Map<string, Project>();
let idCounter = 0;

const inMemoryProjectRepo = {
  findById: jest.fn(async (id: string) => projects.get(id) ?? null),
  findByClientId: jest.fn(async (clientId: string) =>
    [...projects.values()].filter((p) => p.clientId === clientId),
  ),
  findByFreelancerId: jest.fn(async () => []),
  findByStatus: jest.fn(async (status: string) =>
    [...projects.values()].filter((p) => p.status === status),
  ),
  create: jest.fn(async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `project-${++idCounter}`;
    const project: Project = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    projects.set(id, project);
    return project;
  }),
  update: jest.fn(async (id: string, data: Partial<Project>) => {
    const existing = projects.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    projects.set(id, updated);
    return updated;
  }),
  delete: jest.fn(async (id: string) => {
    projects.delete(id);
  }),
};

describe('Projects Integration (Supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        ProjectsService,
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
    projects.clear();
    idCounter = 0;
    mockUser = { id: 'client-1', email: 'client@test.com', role: UserRole.CLIENT };
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /projects ───────────────────────────────────────────────────

  describe('POST /projects', () => {
    const validBody = {
      title: 'E-commerce Redesign',
      description: 'Full redesign of the online store',
      budgetMin: 1000,
      budgetMax: 5000,
      deadline: '2026-06-01T00:00:00.000Z',
      projectType: 'FIXED',
    };

    it('201 — creates project with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .send(validBody)
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'E-commerce Redesign',
        status: 'DRAFT',
        clientId: 'client-1',
      });
      expect(res.body.id).toBeDefined();
    });

    it('400 — rejects when required field (title) is missing', async () => {
      const { title, ...bodyWithoutTitle } = validBody;

      await request(app.getHttpServer())
        .post('/projects')
        .send(bodyWithoutTitle)
        .expect(400);
    });

    it('400 — rejects when budgetMin is negative', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .send({ ...validBody, budgetMin: -100 })
        .expect(400);
    });

    it('400 — rejects unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .send({ ...validBody, hackerField: 'injection' })
        .expect(400);
    });
  });

  // ── PATCH /projects/:id/status ───────────────────────────────────────

  describe('PATCH /projects/:id/status', () => {
    let projectId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .send({
          title: 'Test Project',
          description: 'Test',
          budgetMin: 1000,
          budgetMax: 5000,
          deadline: '2026-06-01T00:00:00.000Z',
          projectType: 'FIXED',
        });
      projectId = res.body.id;
    });

    it('200 — valid transition DRAFT → OPEN', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/projects/${projectId}/status`)
        .send({ status: 'OPEN' })
        .expect(200);

      expect(res.body.status).toBe('OPEN');
    });

    it('409 — invalid transition DRAFT → COMPLETED returns 409', async () => {
      await request(app.getHttpServer())
        .patch(`/projects/${projectId}/status`)
        .send({ status: 'COMPLETED' })
        .expect(409);
    });

    it('404 — non-existent project', async () => {
      await request(app.getHttpServer())
        .patch('/projects/nonexistent-id/status')
        .send({ status: 'OPEN' })
        .expect(404);
    });
  });

  // ── DELETE /projects/:id ─────────────────────────────────────────────

  describe('DELETE /projects/:id', () => {
    it('204 — deletes DRAFT project', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .send({
          title: 'To Delete',
          description: 'Test',
          budgetMin: 100,
          budgetMax: 500,
          deadline: '2026-06-01T00:00:00.000Z',
          projectType: 'FIXED',
        });

      await request(app.getHttpServer())
        .delete(`/projects/${res.body.id}`)
        .expect(204);
    });

    it('409 — cannot delete OPEN project', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .send({
          title: 'To Delete',
          description: 'Test',
          budgetMin: 100,
          budgetMax: 500,
          deadline: '2026-06-01T00:00:00.000Z',
          projectType: 'FIXED',
        });

      await request(app.getHttpServer())
        .patch(`/projects/${res.body.id}/status`)
        .send({ status: 'OPEN' });

      await request(app.getHttpServer())
        .delete(`/projects/${res.body.id}`)
        .expect(409);
    });
  });
});
