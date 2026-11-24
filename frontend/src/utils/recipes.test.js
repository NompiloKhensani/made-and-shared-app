import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collapseRecipesByName,
  extractCategoryList,
  extractRecipeList,
  getRecipeId,
} from "./recipes.js";

test("extractRecipeList reads the recipes array", () => {
  assert.deepEqual(extractRecipeList({ recipes: [{ name: "Stew" }] }), [
    { name: "Stew" },
  ]);
  assert.deepEqual(extractRecipeList({}), []);
});

test("extractCategoryList uses the response or the supplied list", () => {
  assert.deepEqual(extractCategoryList({ categories: ["Braai"] }), ["Braai"]);
  assert.deepEqual(extractCategoryList({}, ["Sides"]), ["Sides"]);
});

test("collapseRecipesByName keeps one original per name", () => {
  const grouped = collapseRecipesByName([
    { name: "Tomato basil pasta", basedOn: "abc", _id: "2" },
    { name: "Tomato basil pasta", basedOn: null, _id: "1" },
    { name: "Beef stew", _id: "3" },
  ]);

  assert.equal(grouped.length, 2);
  const pasta = grouped.find((recipe) => recipe._id === "1");
  assert.equal(pasta.variationCount, 2);
  assert.equal(pasta.basedOn, null);
});

test("getRecipeId reads a string id", () => {
  assert.equal(getRecipeId({ _id: "abc" }), "abc");
  assert.equal(getRecipeId({ id: "abc" }), "abc");
  assert.equal(getRecipeId({}), "");
});
