import { DomainException } from "./DomainException";

export class UnauthorizedBidException extends DomainException {
  constructor() {
    super("User is not authorized to perform this bid action.");
  }
}
