import { Project } from "../Project";
import { ActiveState } from "../states/ActiveState";
import { InReviewState } from "../states/InReviewState";
import { CompletedState } from "../states/CompletedState";
import { DisputedState } from "../states/DisputedState";
import { InvalidStateTransitionException } from "../../exceptions/InvalidStateTransitionException";

describe("Project State Machine", () => {
  it("allows PENDING → ACTIVE", () => {
    const project = new Project("1", "client1");
    expect(() => project.transitionTo(new ActiveState())).not.toThrow();
  });

  it("allows ACTIVE → IN_REVIEW", () => {
    const project = new Project("1", "client1");
    project.transitionTo(new ActiveState());
    expect(() => project.transitionTo(new InReviewState())).not.toThrow();
  });

  it("allows IN_REVIEW → COMPLETED", () => {
    const project = new Project("1", "client1");
    project.transitionTo(new ActiveState());
    project.transitionTo(new InReviewState());
    expect(() => project.transitionTo(new CompletedState())).not.toThrow();
  });

  it("allows IN_REVIEW → ACTIVE (rejection)", () => {
    const project = new Project("1", "client1");
    project.transitionTo(new ActiveState());
    project.transitionTo(new InReviewState());
    expect(() => project.transitionTo(new ActiveState())).not.toThrow();
  });

  it("allows ACTIVE → DISPUTED", () => {
    const project = new Project("1", "client1");
    project.transitionTo(new ActiveState());
    expect(() => project.transitionTo(new DisputedState())).not.toThrow();
  });

  it("rejects IN_REVIEW → DISPUTED", () => {
    const project = new Project("1", "client1");
    project.transitionTo(new ActiveState());
    project.transitionTo(new InReviewState());
    expect(() => project.transitionTo(new DisputedState())).toThrow(InvalidStateTransitionException);
  });

  it("rejects COMPLETED → ACTIVE", () => {
    const project = new Project("1", "client1");
    project.transitionTo(new ActiveState());
    project.transitionTo(new InReviewState());
    project.transitionTo(new CompletedState());
    expect(() => project.transitionTo(new ActiveState())).toThrow(InvalidStateTransitionException);
  });

  it("rejects DISPUTED → IN_REVIEW", () => {
    const project = new Project("1", "client1");
    project.transitionTo(new ActiveState());
    project.transitionTo(new DisputedState());
    expect(() => project.transitionTo(new InReviewState())).toThrow(InvalidStateTransitionException);
  });
});
