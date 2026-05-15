import { ORPCError } from "@orpc/server";

const integrityConstraintStatuses = {
  "23000": 409,
  "23001": 409,
  "23502": 422,
  "23503": 409,
  "23505": 409,
  "23514": 422,
} as const;

const integrityConstraintErrorCodes = {
  "23000": "INTEGRITY_CONSTRAINT_VIOLATION",
  "23001": "RESTRICT_VIOLATION",
  "23502": "NOT_NULL_VIOLATION",
  "23503": "FOREIGN_KEY_VIOLATION",
  "23505": "UNIQUE_VIOLATION",
  "23514": "CHECK_VIOLATION",
} as const;

const constraintMessages: Record<string, string> = {
  members_organization_id_organizations_id_fk: "Organization does not exist",
  members_organization_id_user_id_role_unique: "Member already exists for this organization and role",
  members_user_id_users_id_fk: "User does not exist",
  organization_slug_check: "Organization slug is invalid",
  organization_slug_reserved: "Organization slug is reserved",
  organizations_slug_unique: "Organization slug already exists",
  project_slug_check: "Project slug is invalid",
  project_slug_reserved: "Project slug is reserved",
  projects_organization_id_organizations_id_fk: "Organization does not exist",
  projects_slug_unique: "Project slug already exists",
};

type IntegrityConstraintCode = keyof typeof integrityConstraintStatuses;

type PostgresErrorLike = {
  code: string;
  column?: string;
  constraint?: string;
  cause?: unknown;
  detail?: string;
  schema?: string;
  table?: string;
};

type ParsedKeyDetail = {
  fields: string[];
  values?: string[];
};

const integrityConstraintReasons = {
  "23000": "conflict",
  "23001": "restricted",
  "23502": "required",
  "23503": "missing_reference",
  "23505": "already_exists",
  "23514": "invalid",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIntegrityConstraintCode(code: string): code is IntegrityConstraintCode {
  return code in integrityConstraintStatuses;
}

function findPostgresError(error: unknown) {
  let current = error;
  const seen = new Set<unknown>();

  while (isRecord(current) && !seen.has(current)) {
    seen.add(current);

    if (typeof current.code === "string" && current.code.startsWith("23")) {
      return current as PostgresErrorLike;
    }

    current = current.cause;
  }

  return undefined;
}

function parseKeyDetail(detail?: string): ParsedKeyDetail | undefined {
  if (!detail) {
    return undefined;
  }

  const match = detail.match(/^Key \((.+)\)=\((.*)\)/);

  if (!match) {
    return undefined;
  }

  const fields = match[1]?.split(/\s*,\s*/).filter(Boolean) ?? [];
  const values = match[2]?.split(/\s*,\s*/).filter(Boolean);

  if (fields.length === 0) {
    return undefined;
  }

  return {
    fields,
    values: values && values.length === fields.length ? values : undefined,
  };
}

function isRestrictedForeignKeyViolation(error: PostgresErrorLike) {
  return error.code === "23503" && error.detail?.includes("is still referenced") === true;
}

function getDefaultMessage(error: PostgresErrorLike, parsedKeyDetail?: ParsedKeyDetail) {
  if (isRestrictedForeignKeyViolation(error)) {
    return "Record is still referenced by other data";
  }

  if (error.constraint && constraintMessages[error.constraint]) {
    return constraintMessages[error.constraint];
  }

  if (error.code === "23502" && error.column) {
    return `Field "${error.column}" is required`;
  }

  if (error.code === "23505") {
    const field = parsedKeyDetail?.fields[0];
    return field ? `Field "${field}" already exists` : "A record with the same value already exists";
  }

  if (error.code === "23503") {
    const field = parsedKeyDetail?.fields[0] ?? error.column;
    return field ? `Referenced record for field "${field}" does not exist` : "Referenced record does not exist";
  }

  if (error.code === "23514") {
    return "Input violates a database check constraint";
  }

  if (error.code === "23001") {
    return "Operation violates an existing reference";
  }

  return "Integrity constraint violated";
}

export function toIntegrityConstraintORPCError(error: unknown) {
  const postgresError = findPostgresError(error);

  if (!postgresError) {
    return undefined;
  }

  const parsedKeyDetail = parseKeyDetail(postgresError.detail);
  const postgresCode = postgresError.code;
  const status = isIntegrityConstraintCode(postgresCode) ? integrityConstraintStatuses[postgresCode] : 409;
  const code = isIntegrityConstraintCode(postgresCode)
    ? integrityConstraintErrorCodes[postgresCode]
    : "INTEGRITY_CONSTRAINT_VIOLATION";
  const fields = parsedKeyDetail?.fields ?? (postgresError.column ? [postgresError.column] : undefined);
  const reason = isRestrictedForeignKeyViolation(postgresError)
    ? "restricted"
    : isIntegrityConstraintCode(postgresCode)
      ? integrityConstraintReasons[postgresCode]
      : "conflict";

  return new ORPCError(code, {
    cause: error,
    data: {
      fields,
      reason,
    },
    message: getDefaultMessage(postgresError, parsedKeyDetail),
    status,
  });
}
