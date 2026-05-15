import { z } from "zod";

const integrityConstraintErrorDataSchema = z.object({
  fields: z.array(z.string()).optional(),
  reason: z.enum(["already_exists", "conflict", "invalid", "missing_reference", "required", "restricted"]),
});

const validationErrorDataSchema = z.object({
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
  formErrors: z.array(z.string()),
});

export const appContractErrors = {
  CHECK_VIOLATION: {
    data: integrityConstraintErrorDataSchema,
    status: 422,
  },
  FOREIGN_KEY_VIOLATION: {
    data: integrityConstraintErrorDataSchema,
    status: 409,
  },
  FORBIDDEN: {
    message: "You do not have enough permission to perform this action.",
    status: 403,
  },
  INTEGRITY_CONSTRAINT_VIOLATION: {
    data: integrityConstraintErrorDataSchema,
    status: 409,
  },
  INPUT_VALIDATION_FAILED: {
    data: validationErrorDataSchema,
    status: 422,
  },
  NOT_FOUND: {
    status: 404,
  },
  NOT_NULL_VIOLATION: {
    data: integrityConstraintErrorDataSchema,
    status: 422,
  },
  RESTRICT_VIOLATION: {
    data: integrityConstraintErrorDataSchema,
    status: 409,
  },
  UNAUTHORIZED: {
    message: "Missing user session. Please log in!",
    status: 401,
  },
  UNIQUE_VIOLATION: {
    data: integrityConstraintErrorDataSchema,
    status: 409,
  },
} as const;
