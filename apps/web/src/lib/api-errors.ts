export function isNotFoundAPIError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "NOT_FOUND" &&
    "status" in error &&
    error.status === 404
  );
}

export function isAccessDeniedAPIError(error: unknown) {
  return (
    typeof error === "object" && error !== null && "status" in error && (error.status === 401 || error.status === 403)
  );
}
