export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "The requested record could not be found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends DomainError {
  constructor(message = "This record was changed by someone else.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "You are not signed in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
