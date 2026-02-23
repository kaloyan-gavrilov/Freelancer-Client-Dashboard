import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TimeEntriesService } from '../time-entries.service';
import { TIME_ENTRY_REPOSITORY } from '../../domain/repositories/time-entry.repository.interface';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { TimeEntry } from '../../domain/entities/time-entry.entity';
import { Project } from '../../domain/entities/project.entity';

const mockProject: Project = {
  id: 'project-1',
  clientId: 'client-1',
  freelancerId: 'freelancer-1',
  title: 'Test Project',
  description: 'Test',
  budgetMin: 1000,
  budgetMax: 5000,
  deadline: new Date('2026-06-01'),
  status: 'IN_PROGRESS',
  projectType: 'HOURLY',
  agreedRate: 75,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTimeEntry: TimeEntry = {
  id: 'te-1',
  projectId: 'project-1',
  freelancerId: 'freelancer-1',
  milestoneId: null,
  hours: 4.5,
  description: 'Implemented auth flow',
  date: new Date('2026-02-23'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTimeEntryRepo = {
  findByProjectId: jest.fn(),
  create: jest.fn(),
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

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeEntriesService,
        { provide: TIME_ENTRY_REPOSITORY, useValue: mockTimeEntryRepo },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepo },
      ],
    }).compile();

    service = module.get<TimeEntriesService>(TimeEntriesService);
  });

  // ── findByProject ────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('returns time entries for a project', async () => {
      mockTimeEntryRepo.findByProjectId.mockResolvedValue([mockTimeEntry]);

      const result = await service.findByProject('project-1');

      expect(result).toEqual([mockTimeEntry]);
      expect(mockTimeEntryRepo.findByProjectId).toHaveBeenCalledWith('project-1');
    });

    it('returns empty array when no entries exist', async () => {
      mockTimeEntryRepo.findByProjectId.mockResolvedValue([]);

      const result = await service.findByProject('project-1');

      expect(result).toEqual([]);
    });
  });

  // ── create ───────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a time entry when project exists', async () => {
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockTimeEntryRepo.create.mockResolvedValue(mockTimeEntry);

      const result = await service.create(
        'project-1',
        {
          hours: 4.5,
          description: 'Implemented auth flow',
          date: '2026-02-23T00:00:00.000Z',
        },
        'freelancer-1',
      );

      expect(mockTimeEntryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          freelancerId: 'freelancer-1',
          hours: 4.5,
          milestoneId: null,
        }),
      );
      expect(result).toEqual(mockTimeEntry);
    });

    it('creates a time entry with milestoneId when provided', async () => {
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockTimeEntryRepo.create.mockResolvedValue({
        ...mockTimeEntry,
        milestoneId: 'milestone-1',
      });

      await service.create(
        'project-1',
        {
          hours: 2,
          description: 'Design work',
          date: '2026-02-23T00:00:00.000Z',
          milestoneId: 'milestone-1',
        },
        'freelancer-1',
      );

      expect(mockTimeEntryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ milestoneId: 'milestone-1' }),
      );
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(
          'nonexistent',
          {
            hours: 4.5,
            description: 'test',
            date: '2026-02-23T00:00:00.000Z',
          },
          'freelancer-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
