import assert from "node:assert/strict";
import test from "node:test";

import { checkAnswer, explainSolution, generateTasks } from "../questions.js";

test("generateTasks creates the requested number of unique tasks in range", () => {
  for (const [difficulty, maximum] of [
    ["easy", 15],
    ["medium", 255],
    ["hard", 1023],
  ]) {
    const tasks = generateTasks(difficulty, "balanced", 10);

    assert.equal(tasks.length, 10);
    assert.equal(new Set(tasks.map(task => `${task.value}:${task.direction}`)).size, 10);
    assert.ok(tasks.every(task => task.value >= 0 && task.value <= maximum));
    assert.ok(tasks.every(task => task.evaluated === false));
    assert.ok(tasks.every(task => task.userAnswer === null && task.isCorrect === null));
  }
});

test("generateTasks defaults to ten tasks and balances both directions", () => {
  const tasks = generateTasks("medium", "balanced");
  const decToBinCount = tasks.filter(task => task.direction === "dec-to-bin").length;
  const binToDecCount = tasks.filter(task => task.direction === "bin-to-dec").length;

  assert.equal(tasks.length, 10);
  assert.equal(decToBinCount, 5);
  assert.equal(binToDecCount, 5);
});

test("generateTasks supports each configured direction distribution", () => {
  const cases = [
    ["balanced", 10, 10],
    ["more-dec-to-bin", 12, 8],
    ["more-bin-to-dec", 8, 12],
  ];

  for (const [distribution, expectedDecToBin, expectedBinToDec] of cases) {
    const tasks = generateTasks("hard", distribution, 20);
    assert.equal(tasks.filter(task => task.direction === "dec-to-bin").length, expectedDecToBin);
    assert.equal(tasks.filter(task => task.direction === "bin-to-dec").length, expectedBinToDec);
  }
});

test("generateTasks can reuse a value only in the other conversion direction", () => {
  const tasks = generateTasks("easy", "balanced", 20);
  const pairs = tasks.map(task => `${task.value}:${task.direction}`);

  assert.equal(new Set(pairs).size, 20);
  assert.ok(tasks.some(task => task.direction === "dec-to-bin"));
  assert.ok(tasks.some(task => task.direction === "bin-to-dec"));
});

test("generateTasks validates difficulty, direction distribution, and count", () => {
  assert.throws(() => generateTasks("unknown", "balanced"), RangeError);
  assert.throws(() => generateTasks("easy", "unknown"), RangeError);
  assert.throws(() => generateTasks("easy", "balanced", 1), RangeError);
  assert.throws(() => generateTasks("easy", "dec-to-bin", 17), RangeError);
  assert.throws(() => generateTasks("easy", "balanced", 33), RangeError);
});

test("checkAnswer accepts correct conversions and leading zeroes", () => {
  assert.equal(checkAnswer({ value: 11, direction: "dec-to-bin" }, "1011").correct, true);
  assert.equal(checkAnswer({ value: 11, direction: "dec-to-bin" }, "0001011").correct, true);
  assert.equal(checkAnswer({ value: 11, direction: "bin-to-dec" }, "11").correct, true);
  assert.equal(checkAnswer({ value: 11, direction: "bin-to-dec" }, "00011").correct, true);
  assert.equal(checkAnswer({ value: 0, direction: "bin-to-dec" }, "000").correct, true);
});

test("checkAnswer rejects empty answers, negative values, and invalid digits", () => {
  const binaryTask = { value: 3, direction: "dec-to-bin" };
  const decimalTask = { value: 3, direction: "bin-to-dec" };

  for (const answer of ["", "   "]) {
    assert.equal(checkAnswer(binaryTask, answer).valid, false);
  }
  for (const answer of ["-1", "-0"]) {
    assert.equal(checkAnswer(decimalTask, answer).valid, false);
  }
  for (const answer of ["102", "1a", "1 0"]) {
    assert.equal(checkAnswer(binaryTask, answer).valid, false);
  }
  for (const answer of ["1.5", "1a", "1 0"]) {
    assert.equal(checkAnswer(decimalTask, answer).valid, false);
  }
});

test("checkAnswer reports the expected answer and solution", () => {
  const result = checkAnswer({ value: 11, direction: "bin-to-dec" }, "10");

  assert.equal(result.valid, true);
  assert.equal(result.correct, false);
  assert.equal(result.expectedAnswer, "11");
  assert.match(result.explanation, /1011₂/);
});

test("explainSolution expands decimal-to-binary using division remainders", () => {
  const explanation = explainSolution({ value: 10, direction: "dec-to-bin" });

  assert.match(explanation, /10 ÷ 2 = 5, zbytek 0/);
  assert.match(explanation, /Zbytky čteme odspodu nahoru: 1010₂/);
});

test("explainSolution lists binary powers from highest to lowest and sums term values", () => {
  const explanation = explainSolution({ value: 11, direction: "bin-to-dec" });

  assert.match(
    explanation,
    /1011₂ = 1 × 2³ \+ 0 × 2² \+ 1 × 2¹ \+ 1 × 2⁰ = 8 \+ 0 \+ 2 \+ 1 = 11₁₀/,
  );
  assert.ok(explanation.indexOf("2³") < explanation.indexOf("2²"));
  assert.ok(explanation.indexOf("2²") < explanation.indexOf("2¹"));
  assert.ok(explanation.indexOf("2¹") < explanation.indexOf("2⁰"));
});

test("explainSolution handles zero and the largest supported value", () => {
  const zero = explainSolution({ value: 0, direction: "bin-to-dec" });
  const maximum = explainSolution({ value: 1023, direction: "bin-to-dec" });

  assert.match(zero, /0₂ = 0 × 2⁰ = 0 = 0₁₀/);
  assert.match(maximum, /1111111111₂ = 1 × 2⁹/);
  assert.match(maximum, /= 1023₁₀/);
});

test("explainSolution rejects an unknown conversion direction", () => {
  assert.throws(() => explainSolution({ value: 1, direction: "unknown" }), RangeError);
});
