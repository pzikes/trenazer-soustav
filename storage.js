const STORAGE_KEY = "trenazer-ciselnych-soustav.history.v1";
const MAX_HISTORY_ENTRIES = 10;
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const QUESTION_COUNTS = new Set([5, 10, 20]);

function getLocalStorage() {
  return globalThis.localStorage;
}

function createStorageError(error) {
  return {
    ok: false,
    history: [],
    error,
  };
}

function isHistoryEntry(entry) {
  if (entry === null || typeof entry !== "object") {
    return false;
  }

  try {
    return typeof entry.completedAt === "string"
      && !Number.isNaN(Date.parse(entry.completedAt))
      && new Date(entry.completedAt).toISOString() === entry.completedAt
      && DIFFICULTIES.has(entry.difficulty)
      && Number.isInteger(entry.questionCount)
      && QUESTION_COUNTS.has(entry.questionCount)
      && Number.isInteger(entry.score)
      && entry.score >= 0
      && entry.score <= entry.questionCount
      && Number.isInteger(entry.percentage)
      && entry.percentage === Math.round((entry.score / entry.questionCount) * 100);
  } catch {
    return false;
  }
}

function readStorage(storageProvider) {
  let storedValue;
  try {
    const storage = storageProvider();
    if (!storage || typeof storage.getItem !== "function") {
      return createStorageError("unavailable");
    }

    storedValue = storage.getItem(STORAGE_KEY);
  } catch {
    return createStorageError("unavailable");
  }

  if (storedValue === null) {
    return { ok: true, history: [] };
  }

  let history;
  try {
    history = JSON.parse(storedValue);
  } catch {
    return createStorageError("corrupt");
  }

  if (!Array.isArray(history) || !history.every(isHistoryEntry)) {
    return createStorageError("corrupt");
  }

  return {
    ok: true,
    history: history.slice(0, MAX_HISTORY_ENTRIES),
  };
}

export function loadHistory(storageProvider = getLocalStorage) {
  return readStorage(storageProvider);
}

export function saveResult(result, storageProvider = getLocalStorage) {
  const loaded = readStorage(storageProvider);
  if (!loaded.ok) {
    return loaded;
  }

  if (
    !result
    || !DIFFICULTIES.has(result.difficulty)
    || !QUESTION_COUNTS.has(result.questionCount)
    || !Number.isInteger(result.score)
    || result.score < 0
    || result.score > result.questionCount
  ) {
    return {
      ok: false,
      history: loaded.history,
      error: "invalid-result",
    };
  }

  const entry = {
    completedAt: new Date().toISOString(),
    difficulty: result.difficulty,
    score: result.score,
    questionCount: result.questionCount,
    percentage: Math.round((result.score / result.questionCount) * 100),
  };
  const history = [entry, ...loaded.history].slice(0, MAX_HISTORY_ENTRIES);

  try {
    const storage = storageProvider();
    storage.setItem(STORAGE_KEY, JSON.stringify(history));
    return { ok: true, history };
  } catch {
    return {
      ok: false,
      history: loaded.history,
      error: "write-failed",
    };
  }
}

export function clearHistory(storageProvider = getLocalStorage) {
  try {
    const storage = storageProvider();
    if (!storage || typeof storage.removeItem !== "function") {
      return createStorageError("unavailable");
    }

    storage.removeItem(STORAGE_KEY);
    return { ok: true, history: [] };
  } catch {
    return createStorageError("clear-failed");
  }
}
