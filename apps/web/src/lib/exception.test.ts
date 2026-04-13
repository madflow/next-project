import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ZodError } from "zod";
import {
  DalValidationException,
  HttpException,
  ServerActionValidationException,
  raiseExceptionResponse,
} from "./exception";

describe("raiseExceptionResponse", () => {
  test("passes through existing HttpException", async () => {
    const response = raiseExceptionResponse(new HttpException(400, { message: "Bad input" }));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Bad input" });
  });

  test("maps DAL validation errors to bad request", async () => {
    const response = raiseExceptionResponse(new DalValidationException("Invalid filter"));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid filter" });
  });

  test("maps server action validation errors to unprocessable entity", async () => {
    const response = raiseExceptionResponse(new ServerActionValidationException("Invalid payload"));

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { error: "Invalid payload" });
  });

  test("maps Zod errors to bad request", async () => {
    const response = raiseExceptionResponse(
      new ZodError([
        {
          code: "custom",
          path: ["limit"],
          message: "Invalid limit",
        },
      ])
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid limit" });
  });
});
