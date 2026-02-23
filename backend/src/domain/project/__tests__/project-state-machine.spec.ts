import { ProjectStateMachine } from '../ProjectStateMachine';
import { ProjectState } from '../ProjectState';
import { InvalidStateTransitionException } from '../../exceptions/InvalidStateTransitionException';

describe('ProjectStateMachine', () => {
  // ── Valid transitions ────────────────────────────────────────────────

  describe('valid transitions', () => {
    it('DRAFT → OPEN', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.DRAFT, ProjectState.OPEN),
      ).toBe(true);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.DRAFT, ProjectState.OPEN),
      ).not.toThrow();
    });

    it('OPEN → IN_PROGRESS', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.OPEN, ProjectState.IN_PROGRESS),
      ).toBe(true);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.OPEN, ProjectState.IN_PROGRESS),
      ).not.toThrow();
    });

    it('OPEN → CLOSED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.OPEN, ProjectState.CLOSED),
      ).toBe(true);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.OPEN, ProjectState.CLOSED),
      ).not.toThrow();
    });

    it('IN_PROGRESS → COMPLETED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.IN_PROGRESS, ProjectState.COMPLETED),
      ).toBe(true);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.IN_PROGRESS, ProjectState.COMPLETED),
      ).not.toThrow();
    });

    it('COMPLETED → CLOSED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.COMPLETED, ProjectState.CLOSED),
      ).toBe(true);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.COMPLETED, ProjectState.CLOSED),
      ).not.toThrow();
    });
  });

  // ── Invalid transitions ──────────────────────────────────────────────

  describe('invalid transitions', () => {
    it('DRAFT → IN_PROGRESS (must go through OPEN)', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.DRAFT, ProjectState.IN_PROGRESS),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.DRAFT, ProjectState.IN_PROGRESS),
      ).toThrow(InvalidStateTransitionException);
    });

    it('DRAFT → COMPLETED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.DRAFT, ProjectState.COMPLETED),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.DRAFT, ProjectState.COMPLETED),
      ).toThrow(InvalidStateTransitionException);
    });

    it('DRAFT → CLOSED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.DRAFT, ProjectState.CLOSED),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.DRAFT, ProjectState.CLOSED),
      ).toThrow(InvalidStateTransitionException);
    });

    it('OPEN → DRAFT (no backwards)', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.OPEN, ProjectState.DRAFT),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.OPEN, ProjectState.DRAFT),
      ).toThrow(InvalidStateTransitionException);
    });

    it('OPEN → COMPLETED (must go through IN_PROGRESS)', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.OPEN, ProjectState.COMPLETED),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.OPEN, ProjectState.COMPLETED),
      ).toThrow(InvalidStateTransitionException);
    });

    it('IN_PROGRESS → DRAFT', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.IN_PROGRESS, ProjectState.DRAFT),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.IN_PROGRESS, ProjectState.DRAFT),
      ).toThrow(InvalidStateTransitionException);
    });

    it('IN_PROGRESS → OPEN', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.IN_PROGRESS, ProjectState.OPEN),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.IN_PROGRESS, ProjectState.OPEN),
      ).toThrow(InvalidStateTransitionException);
    });

    it('IN_PROGRESS → CLOSED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.IN_PROGRESS, ProjectState.CLOSED),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.IN_PROGRESS, ProjectState.CLOSED),
      ).toThrow(InvalidStateTransitionException);
    });

    it('COMPLETED → DRAFT', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.COMPLETED, ProjectState.DRAFT),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.COMPLETED, ProjectState.DRAFT),
      ).toThrow(InvalidStateTransitionException);
    });

    it('COMPLETED → OPEN', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.COMPLETED, ProjectState.OPEN),
      ).toBe(false);
    });

    it('COMPLETED → IN_PROGRESS', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.COMPLETED, ProjectState.IN_PROGRESS),
      ).toBe(false);
    });

    it('CLOSED → any state (terminal)', () => {
      const allStates = Object.values(ProjectState);
      for (const target of allStates) {
        expect(
          ProjectStateMachine.canTransition(ProjectState.CLOSED, target),
        ).toBe(false);
        expect(() =>
          ProjectStateMachine.assertTransition(ProjectState.CLOSED, target),
        ).toThrow(InvalidStateTransitionException);
      }
    });
  });

  // ── Same-state transitions ───────────────────────────────────────────

  describe('same-state transitions (idempotent rejection)', () => {
    it('rejects DRAFT → DRAFT', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.DRAFT, ProjectState.DRAFT),
      ).toBe(false);
      expect(() =>
        ProjectStateMachine.assertTransition(ProjectState.DRAFT, ProjectState.DRAFT),
      ).toThrow(InvalidStateTransitionException);
    });

    it('rejects OPEN → OPEN', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.OPEN, ProjectState.OPEN),
      ).toBe(false);
    });

    it('rejects IN_PROGRESS → IN_PROGRESS', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.IN_PROGRESS, ProjectState.IN_PROGRESS),
      ).toBe(false);
    });

    it('rejects COMPLETED → COMPLETED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.COMPLETED, ProjectState.COMPLETED),
      ).toBe(false);
    });

    it('rejects CLOSED → CLOSED', () => {
      expect(
        ProjectStateMachine.canTransition(ProjectState.CLOSED, ProjectState.CLOSED),
      ).toBe(false);
    });
  });

  // ── Exception message format ─────────────────────────────────────────

  describe('exception details', () => {
    it('includes from and to states in the error message', () => {
      try {
        ProjectStateMachine.assertTransition(ProjectState.DRAFT, ProjectState.COMPLETED);
        fail('Expected InvalidStateTransitionException');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidStateTransitionException);
        expect((e as Error).message).toContain('draft');
        expect((e as Error).message).toContain('completed');
      }
    });
  });
});
