import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { canDeleteAvatarForUser } from "./avatar-authorization";

describe("canDeleteAvatarForUser", () => {
  test("allows a user to delete their own avatar", () => {
    assert.equal(
      canDeleteAvatarForUser({
        sessionUserId: "user-1",
        targetUserId: "user-1",
        isAdmin: false,
      }),
      true
    );
  });

  test("allows an admin to delete another user's avatar", () => {
    assert.equal(
      canDeleteAvatarForUser({
        sessionUserId: "admin-1",
        targetUserId: "user-2",
        isAdmin: true,
      }),
      true
    );
  });

  test("rejects deleting another user's avatar without admin access", () => {
    assert.equal(
      canDeleteAvatarForUser({
        sessionUserId: "user-1",
        targetUserId: "user-2",
        isAdmin: false,
      }),
      false
    );
  });
});
