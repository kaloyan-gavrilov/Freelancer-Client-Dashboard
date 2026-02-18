import { DomainException } from "./DomainException";

export class BudgetExceededException extends DomainException {
  constructor() {
    super("Project budget exceeded.");
  }
}
