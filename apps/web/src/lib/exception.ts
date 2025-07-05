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

export const statusCodeToReasonPhrase: Record<StatusCode, string> = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  103: "Early Hints",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Moved Temporarily",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  306: "Switch Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Request Entity Too Large",
  414: "Request-URI Too Long",
  415: "Unsupported Media Type",
  416: "Requested Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  419: "Insufficient Space on Resource",
  420: "Method Failure",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  425: "Too Early",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
};

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

export function apiExceptionHandler(error: HttpException) {
  return NextResponse.json({ error: error.message }, { status: error.status });
}
