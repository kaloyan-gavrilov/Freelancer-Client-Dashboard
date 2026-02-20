import { DomainException } from "./DomainException";

export class InvalidStateTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(`Invalid state transition: ${from} → ${to}`);
  }
}
