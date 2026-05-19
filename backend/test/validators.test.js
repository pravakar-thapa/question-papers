const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");

const { areObjectIdsEqual } = require("../utils/validators");

test("ObjectId comparison matches ObjectId and string values", () => {
  const id = new mongoose.Types.ObjectId();

  assert.equal(areObjectIdsEqual(id, id.toString()), true);
  assert.equal(areObjectIdsEqual(id.toString(), id), true);
});

test("ObjectId comparison handles populated user-like objects", () => {
  const id = new mongoose.Types.ObjectId();

  assert.equal(areObjectIdsEqual({ _id: id }, id.toString()), true);
  assert.equal(areObjectIdsEqual({ id: id.toString() }, id), true);
});

test("ObjectId comparison rejects different ids", () => {
  assert.equal(
    areObjectIdsEqual(
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ),
    false,
  );
});
