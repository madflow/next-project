import assert from "node:assert";
import { describe, test } from "node:test";
import { clsx } from "./index.js";

const fn = clsx;

describe("clsx", () => {
  test("exports", () => {
    assert.strictEqual(typeof clsx, "function");
    assert.strictEqual(typeof fn(), "string");
  });

  test("strings", () => {
    assert.strictEqual(fn(""), "");
    assert.strictEqual(fn("foo"), "foo");
    assert.strictEqual(fn(true && "foo"), "foo");
    assert.strictEqual(fn(false && "foo"), "");
  });

  test("strings (variadic)", () => {
    assert.strictEqual(fn(""), "");
    assert.strictEqual(fn("foo", "bar"), "foo bar");
    assert.strictEqual(fn(true && "foo", false && "bar", "baz"), "foo baz");
    assert.strictEqual(fn(false && "foo", "bar", "baz", ""), "bar baz");
  });

  test("numbers", () => {
    assert.strictEqual(fn(1), "1");
    assert.strictEqual(fn(12), "12");
    assert.strictEqual(fn(0.1), "0.1");
    assert.strictEqual(fn(0), "");
    assert.strictEqual(fn(Infinity), "Infinity");
    assert.strictEqual(fn(NaN), "");
  });

  test("numbers (variadic)", () => {
    assert.strictEqual(fn(0, 1), "1");
    assert.strictEqual(fn(1, 2), "1 2");
  });

  test("objects", () => {
    assert.strictEqual(fn({}), "");
    assert.strictEqual(fn({ foo: true }), "foo");
    assert.strictEqual(fn({ foo: true, bar: false }), "foo");
    assert.strictEqual(fn({ foo: "hiya", bar: 1 }), "foo bar");
    assert.strictEqual(fn({ foo: 1, bar: 0, baz: 1 }), "foo baz");
    assert.strictEqual(fn({ "-foo": 1, "--bar": 1 }), "-foo --bar");
  });

  test("objects (variadic)", () => {
    assert.strictEqual(fn({}, {}), "");
    assert.strictEqual(fn({ foo: 1 }, { bar: 2 }), "foo bar");
    assert.strictEqual(fn({ foo: 1 }, null, { baz: 1, bat: 0 }), "foo baz");
    assert.strictEqual(fn({ foo: 1 }, {}, {}, { bar: "a" }, { baz: null, bat: Infinity }), "foo bar bat");
  });

  test("arrays", () => {
    assert.strictEqual(fn([]), "");
    assert.strictEqual(fn(["foo"]), "foo");
    assert.strictEqual(fn(["foo", "bar"]), "foo bar");
    assert.strictEqual(fn(["foo", 0 && "bar", 1 && "baz"]), "foo baz");
  });

  test("arrays (nested)", () => {
    assert.strictEqual(fn([[[]]]), "");
    assert.strictEqual(fn([[["foo"]]]), "foo");
    assert.strictEqual(fn([true, [["foo"]]]), "foo");
    assert.strictEqual(fn(["foo", ["bar", ["", [["baz"]]]]]), "foo bar baz");
  });

  test("arrays (variadic)", () => {
    assert.strictEqual(fn([], []), "");
    assert.strictEqual(fn(["foo"], ["bar"]), "foo bar");
    assert.strictEqual(fn(["foo"], null, ["baz", ""], true, "", []), "foo baz");
  });

  test("arrays (no `push` escape)", () => {
    assert.strictEqual(fn({ push: 1 }), "push");
    assert.strictEqual(fn({ pop: true }), "pop");
    assert.strictEqual(fn({ push: true }), "push");
    assert.strictEqual(fn("hello", { world: 1, push: true }), "hello world push");
  });

  test("functions", () => {
    const foo = () => {};
    assert.strictEqual(fn(foo, "hello"), "hello");
    assert.strictEqual(fn(foo, "hello", fn), "hello");
    assert.strictEqual(fn(foo, "hello", [[fn], "world"]), "hello world");
  });
});
