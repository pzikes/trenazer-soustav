import assert from "node:assert/strict";
import test from "node:test";

import { clearHistory, loadHistory, saveResult } from "../storage.js";

const STORAGE_KEY = "trenazer-ciselnych-soustav.history.v1";

function createMemoryStorage(initialValue = null, overrides = {}) {
  const values = new Map();
  if (initialValue !== null) {
    values.set(STORAGE_KEY, initialValue);
  }

  return {
    values,
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    ...overrides,
  };
}

function storageProvider(storage) {
  return () => storage;
}

function validResult(overrides = {}) {
  return {
    difficulty: "medium",
    score: 8,
    questionCount: 10,
    ...overrides,
  };
}

test("loadHistory returns an empty list when no saved history exists", () => {
  const result = loadHistory(storageProvider(createMemoryStorage()));

  assert.deepEqual(result, { ok: true, history: [] });
});

test("saveResult stores validated result fields and an ISO completion date", () => {
  const storage = createMemoryStorage();
  const result = saveResult(validResult(), storageProvider(storage));

  assert.equal(result.ok, true);
  assert.equal(result.history.length, 1);
  assert.equal(result.history[0].difficulty, "medium");
  assert.equal(result.history[0].score, 8);
  assert.equal(result.history[0].questionCount, 10);
  assert.equal(result.history[0].percentage, 80);
  assert.equal(new Date(result.history[0].completedAt).toISOString(), result.history[0].completedAt);
  assert.deepEqual(loadHistory(storageProvider(storage)).history, result.history);
});

test("saveResult retains only the ten newest entries", () => {
  const storage = createMemoryStorage();

  for (let score = 0; score < 12; score += 1) {
    const result = saveResult(
      validResult({ score, questionCount: 20 }),
      storageProvider(storage),
    );
    assert.equal(result.ok, true);
  }

  const loaded = loadHistory(storageProvider(storage));
  assert.equal(loaded.history.length, 10);
  assert.equal(loaded.history[0].score, 11);
  assert.equal(loaded.history.at(-1).score, 2);
});

test("loadHistory reports corrupt JSON and saveResult does not overwrite it", () => {
  const storage = createMemoryStorage("{invalid json");

  assert.deepEqual(loadHistory(storageProvider(storage)), {
    ok: false,
    history: [],
    error: "corrupt",
  });
  assert.equal(saveResult(validResult(), storageProvider(storage)).error, "corrupt");
  assert.equal(storage.values.get(STORAGE_KEY), "{invalid json");
});

test("loadHistory rejects malformed entries rather than displaying partial data", () => {
  const storage = createMemoryStorage(JSON.stringify([
    {
      completedAt: "not-a-date",
      difficulty: "easy",
      score: 1,
      questionCount: 5,
      percentage: 20,
    },
  ]));

  assert.equal(loadHistory(storageProvider(storage)).error, "corrupt");
});

test("loadHistory reports out-of-range dates as corrupt data", () => {
  const storage = createMemoryStorage(JSON.stringify([
    {
      completedAt: "999999-01-01T00:00:00.000Z",
      difficulty: "easy",
      score: 1,
      questionCount: 5,
      percentage: 20,
    },
  ]));

  assert.equal(loadHistory(storageProvider(storage)).error, "corrupt");
});

test("loadHistory reports unavailable storage and read errors", () => {
  assert.equal(loadHistory(() => undefined).error, "unavailable");
  assert.equal(
    loadHistory(() => {
      throw new Error("storage access denied");
    }).error,
    "unavailable",
  );
  assert.equal(
    loadHistory(() => ({
      getItem() {
        throw new Error("read denied");
      },
    })).error,
    "unavailable",
  );
});

test("saveResult reports write errors and invalid result data", () => {
  const storage = createMemoryStorage(null, {
    setItem() {
      throw new Error("quota exceeded");
    },
  });
  assert.equal(saveResult(validResult(), storageProvider(storage)).error, "write-failed");
  assert.equal(saveResult(validResult({ score: 11 }), storageProvider(createMemoryStorage())).error, "invalid-result");
});

test("clearHistory removes saved and corrupt history", () => {
  const storage = createMemoryStorage("{corrupt");

  assert.deepEqual(clearHistory(storageProvider(storage)), { ok: true, history: [] });
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("clearHistory reports inaccessible storage and removal errors", () => {
  assert.equal(clearHistory(() => undefined).error, "unavailable");
  assert.equal(
    clearHistory(() => ({
      removeItem() {
        throw new Error("remove denied");
      },
    })).error,
    "clear-failed",
  );
});
