import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ProjectsService } from '../projects.service';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { Project } from '../../domain/entities/project.entity';

const mockProject: Project = {
  id: 'project-1',
  clientId: 'client-1',
  freelancerId: null,
  title: 'Test Project',
  description: 'Test description',
  budgetMin: 1000,
  budgetMax: 5000,
  deadline: new Date('2026-06-01'),
  status: 'DRAFT',
  projectType: 'FIXED',
  agreedRate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepo },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  // ── create ───────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a project with DRAFT status', async () => {
      mockProjectRepo.create.mockResolvedValue(mockProject);

      const result = await service.create(
        {
          title: 'Test Project',
          description: 'Test description',
          budgetMin: 1000,
          budgetMax: 5000,
          deadline: '2026-06-01T00:00:00.000Z',
          projectType: 'FIXED',
        },
        'client-1',
      );

      expect(mockProjectRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT', clientId: 'client-1' }),
      );
      expect(result).toEqual(mockProject);
    });
  });

  // ── findById ─────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('returns project when found', async () => {
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      const result = await service.findById('project-1');
      expect(result).toEqual(mockProject);
    });

    it('throws NotFoundException when not found', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── updateStatus ─────────────────────────────────────────────────────

  describe('updateStatus()', () => {
    it('updates status for valid transition (DRAFT → OPEN)', async () => {
      mockProjectRepo.findById.mockResolvedValue({ ...mockProject, status: 'DRAFT' });
      mockProjectRepo.update.mockResolvedValue({ ...mockProject, status: 'OPEN' });

      const result = await service.updateStatus('project-1', 'OPEN', 'client-1');

      expect(mockProjectRepo.update).toHaveBeenCalledWith('project-1', { status: 'OPEN' });
      expect(result.status).toBe('OPEN');
    });

    it('throws ForbiddenException when client does not own project', async () => {
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      await expect(
        service.updateStatus('project-1', 'OPEN', 'other-client'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws InvalidStateTransitionException for invalid transition (DRAFT → COMPLETED)', async () => {
      mockProjectRepo.findById.mockResolvedValue({ ...mockProject, status: 'DRAFT' });

      await expect(
        service.updateStatus('project-1', 'COMPLETED', 'client-1'),
      ).rejects.toThrow();
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', 'OPEN', 'client-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('deletes a DRAFT project', async () => {
      mockProjectRepo.findById.mockResolvedValue({ ...mockProject, status: 'DRAFT' });
      mockProjectRepo.delete.mockResolvedValue(undefined);

      await expect(service.remove('project-1', 'client-1')).resolves.toBeUndefined();
      expect(mockProjectRepo.delete).toHaveBeenCalledWith('project-1');
    });

    it('throws ConflictException for non-DRAFT project', async () => {
      mockProjectRepo.findById.mockResolvedValue({ ...mockProject, status: 'OPEN' });

      await expect(service.remove('project-1', 'client-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ForbiddenException when client does not own project', async () => {
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      await expect(service.remove('project-1', 'other-client')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
