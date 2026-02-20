# Project State Machine Diagram

The diagram shows the various states a project can be in, as well as the transitions between those states. The states include:

- PENDING: The project has been created but is not yet active.
- ACTIVE: The project is currently active and work is being done on it.
- IN_REVIEW: The project is under review, possibly for quality assurance or client feedback.
- DISPUTED: The project is in a disputed state, which may occur if there are disagreements between the client and freelancer.
- COMPLETED: The project has been completed successfully.

stateDiagram-v2
  [*] --> PENDING
  PENDING --> ACTIVE
  ACTIVE --> IN_REVIEW
  ACTIVE --> DISPUTED
  IN_REVIEW --> COMPLETED
  IN_REVIEW --> ACTIVE
  COMPLETED --> [*]
  DISPUTED --> [*]
