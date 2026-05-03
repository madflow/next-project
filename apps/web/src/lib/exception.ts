import { NextResponse } from "next/server";

export type InfoStatusCode = 100 | 101 | 102 | 103;
export type SuccessStatusCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226;
export type DeprecatedStatusCode = 305 | 306;
export type RedirectStatusCode = 300 | 301 | 302 | 303 | 304 | DeprecatedStatusCode | 307 | 308;
export type ClientErrorStatusCode =
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 419
  | 420
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 451;
export type ServerErrorStatusCode = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

export type StatusCode =
  | InfoStatusCode
  | SuccessStatusCode
  | RedirectStatusCode
  | ClientErrorStatusCode
  | ServerErrorStatusCode;

export type ContentlessStatusCode = 101 | 204 | 205 | 304;
export type ContentfulStatusCode = Exclude<StatusCode, ContentlessStatusCode>;

type HTTPExceptionOptions = {
  message?: string;
  cause?: unknown;
};

export class HttpException extends Error {
  public readonly status: number;
  constructor(status: ContentfulStatusCode, options?: HTTPExceptionOptions) {
    super(options?.message, { cause: options?.cause });
    this.status = status;
  }
}

export class DalException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class DalNotAuthorizedException extends DalException {
  constructor(message: string) {
    super(message);
  }
}

export class DalNotFoundException extends DalException {
  constructor(message: string) {
    super(message);
  }
}

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

export class ServerActionFailureException extends ServerActionException {
  constructor(message: string) {
    super(message);
  }
}

export class ServerActionValidationException extends ServerActionException {
  constructor(message: string) {
    super(message);
  }
}

const toHttpException = (error: unknown): HttpException => {
  if (error instanceof DalNotAuthorizedException) {
    return new HttpException(401, { message: error.message });
  } else if (error instanceof DalNotFoundException) {
    return new HttpException(404, { message: error.message });
  } else if (error instanceof ServerActionNotAuthorizedException) {
    return new HttpException(401, { message: error.message });
  } else if (error instanceof ServerActionFailureException) {
    return new HttpException(500, { message: error.message });
  } else if (error instanceof ServerActionValidationException) {
    return new HttpException(422, { message: error.message });
  }
  return new HttpException(500, { message: "An error occurred" });
};

export function raiseExceptionResponse(error: unknown) {
  return apiExceptionHandler(toHttpException(error));
}

function apiExceptionHandler(error: HttpException) {
  return NextResponse.json({ error: error.message }, { status: error.status });
}
