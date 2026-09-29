export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}
