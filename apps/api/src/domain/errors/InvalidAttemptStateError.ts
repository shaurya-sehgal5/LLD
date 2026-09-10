import { DomainError } from "./DomainError";

export class InvalidAttemptStateError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAttemptStateError";
  }
}
