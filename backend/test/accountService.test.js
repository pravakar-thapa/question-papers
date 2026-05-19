const assert = require("node:assert/strict");
const test = require("node:test");
const {
  ACCOUNT_DELETION_WAIT_DAYS,
  deletionScheduleDate,
  passwordValidationError,
} = require("../services/accountService");

test("account deletion schedule waits 30 days", () => {
  const start = new Date("2026-05-19T00:00:00.000Z");
  const scheduledFor = deletionScheduleDate(start);

  assert.equal(ACCOUNT_DELETION_WAIT_DAYS, 30);
  assert.equal(scheduledFor.toISOString(), "2026-06-18T00:00:00.000Z");
});

test("password validation requires a minimum length", () => {
  assert.equal(
    passwordValidationError("short"),
    "Password must be at least 6 characters",
  );
  assert.equal(passwordValidationError("strong-password"), null);
});
