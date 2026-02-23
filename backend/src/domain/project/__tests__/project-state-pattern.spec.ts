import { Project } from '../Project';
import { PendingState } from '../states/PendingState';
import { ActiveState } from '../states/ActiveState';
import { InReviewState } from '../states/InReviewState';
import { CompletedState } from '../states/CompletedState';
import { DisputedState } from '../states/DisputedState';
import { InvalidStateTransitionException } from '../../exceptions/InvalidStateTransitionException';

describe('Project (State Pattern)', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project('project-1', 'client-1');
  });

  // ── Initial state ────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts in PendingState', () => {
      expect(project.getState()).toBeInstanceOf(PendingState);
      expect(project.getState().name).toBe('PENDING');
    });
  });

  // ── Valid transitions from PENDING ───────────────────────────────────

  describe('from PENDING', () => {
    it('allows PENDING → ACTIVE', () => {
      expect(() => project.transitionTo(new ActiveState())).not.toThrow();
      expect(project.getState()).toBeInstanceOf(ActiveState);
    });

    it('rejects PENDING → IN_REVIEW', () => {
      expect(() => project.transitionTo(new InReviewState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects PENDING → COMPLETED', () => {
      expect(() => project.transitionTo(new CompletedState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects PENDING → DISPUTED', () => {
      expect(() => project.transitionTo(new DisputedState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects PENDING → PENDING (same state)', () => {
      expect(() => project.transitionTo(new PendingState())).toThrow(
        InvalidStateTransitionException,
      );
    });
  });

  // ── Valid transitions from ACTIVE ────────────────────────────────────

  describe('from ACTIVE', () => {
    beforeEach(() => {
      project.transitionTo(new ActiveState());
    });

    it('allows ACTIVE → IN_REVIEW', () => {
      expect(() => project.transitionTo(new InReviewState())).not.toThrow();
      expect(project.getState()).toBeInstanceOf(InReviewState);
    });

    it('allows ACTIVE → DISPUTED', () => {
      expect(() => project.transitionTo(new DisputedState())).not.toThrow();
      expect(project.getState()).toBeInstanceOf(DisputedState);
    });

    it('rejects ACTIVE → PENDING', () => {
      expect(() => project.transitionTo(new PendingState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects ACTIVE → COMPLETED', () => {
      expect(() => project.transitionTo(new CompletedState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects ACTIVE → ACTIVE (same state)', () => {
      expect(() => project.transitionTo(new ActiveState())).toThrow(
        InvalidStateTransitionException,
      );
    });
  });

  // ── Valid transitions from IN_REVIEW ─────────────────────────────────

  describe('from IN_REVIEW', () => {
    beforeEach(() => {
      project.transitionTo(new ActiveState());
      project.transitionTo(new InReviewState());
    });

    it('allows IN_REVIEW → COMPLETED', () => {
      expect(() => project.transitionTo(new CompletedState())).not.toThrow();
      expect(project.getState()).toBeInstanceOf(CompletedState);
    });

    it('allows IN_REVIEW → ACTIVE (rejection / revision)', () => {
      expect(() => project.transitionTo(new ActiveState())).not.toThrow();
      expect(project.getState()).toBeInstanceOf(ActiveState);
    });

    it('rejects IN_REVIEW → PENDING', () => {
      expect(() => project.transitionTo(new PendingState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects IN_REVIEW → DISPUTED', () => {
      expect(() => project.transitionTo(new DisputedState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects IN_REVIEW → IN_REVIEW (same state)', () => {
      expect(() => project.transitionTo(new InReviewState())).toThrow(
        InvalidStateTransitionException,
      );
    });
  });

  // ── COMPLETED is terminal ────────────────────────────────────────────

  describe('from COMPLETED (terminal)', () => {
    beforeEach(() => {
      project.transitionTo(new ActiveState());
      project.transitionTo(new InReviewState());
      project.transitionTo(new CompletedState());
    });

    it('rejects COMPLETED → ACTIVE', () => {
      expect(() => project.transitionTo(new ActiveState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects COMPLETED → IN_REVIEW', () => {
      expect(() => project.transitionTo(new InReviewState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects COMPLETED → PENDING', () => {
      expect(() => project.transitionTo(new PendingState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects COMPLETED → DISPUTED', () => {
      expect(() => project.transitionTo(new DisputedState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects COMPLETED → COMPLETED (same state)', () => {
      expect(() => project.transitionTo(new CompletedState())).toThrow(
        InvalidStateTransitionException,
      );
    });
  });

  // ── DISPUTED is terminal ─────────────────────────────────────────────

  describe('from DISPUTED (terminal)', () => {
    beforeEach(() => {
      project.transitionTo(new ActiveState());
      project.transitionTo(new DisputedState());
    });

    it('rejects DISPUTED → ACTIVE', () => {
      expect(() => project.transitionTo(new ActiveState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects DISPUTED → IN_REVIEW', () => {
      expect(() => project.transitionTo(new InReviewState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects DISPUTED → COMPLETED', () => {
      expect(() => project.transitionTo(new CompletedState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects DISPUTED → PENDING', () => {
      expect(() => project.transitionTo(new PendingState())).toThrow(
        InvalidStateTransitionException,
      );
    });

    it('rejects DISPUTED → DISPUTED (same state)', () => {
      expect(() => project.transitionTo(new DisputedState())).toThrow(
        InvalidStateTransitionException,
      );
    });
  });

  // ── Multi-step paths ─────────────────────────────────────────────────

  describe('multi-step paths', () => {
    it('PENDING → ACTIVE → IN_REVIEW → ACTIVE → IN_REVIEW → COMPLETED (revision cycle)', () => {
      project.transitionTo(new ActiveState());
      project.transitionTo(new InReviewState());
      project.transitionTo(new ActiveState()); // revision
      project.transitionTo(new InReviewState());
      project.transitionTo(new CompletedState());
      expect(project.getState()).toBeInstanceOf(CompletedState);
    });

    it('PENDING → ACTIVE → DISPUTED (dispute from active)', () => {
      project.transitionTo(new ActiveState());
      project.transitionTo(new DisputedState());
      expect(project.getState()).toBeInstanceOf(DisputedState);
    });
  });

  // ── Exception message ────────────────────────────────────────────────

  describe('exception message content', () => {
    it('includes both state names', () => {
      try {
        project.transitionTo(new CompletedState());
        fail('Expected InvalidStateTransitionException');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidStateTransitionException);
        expect((e as Error).message).toContain('PENDING');
        expect((e as Error).message).toContain('COMPLETED');
      }
    });
  });
});
