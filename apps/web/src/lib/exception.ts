export class ServerActionException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ServerActionNotAuthorizedException extends ServerActionException {
  constructor(message: string) {
    super(message);
  }
}

export class ServerActionValidationException extends ServerActionException {
  constructor(message: string) {
    super(message);
  }
}
