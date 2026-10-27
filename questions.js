const DIFFICULTY_MAXIMUMS = Object.freeze({
  easy: 15,
  medium: 255,
  hard: 1023,
});

const DIRECTIONS = new Set(["dec-to-bin", "bin-to-dec"]);
const DIRECTION_DISTRIBUTIONS = new Set([
  "balanced",
  "more-dec-to-bin",
  "more-bin-to-dec",
]);

export function generateTasks(difficulty, directionDistribution, count = 10) {
  const maximum = DIFFICULTY_MAXIMUMS[difficulty];

  if (maximum === undefined) {
    throw new RangeError(`Neznámá obtížnost: ${difficulty}`);
  }
  if (!DIRECTIONS.has(directionDistribution) && !DIRECTION_DISTRIBUTIONS.has(directionDistribution)) {
    throw new RangeError(`Neznámé zastoupení převodů: ${directionDistribution}`);
  }
  const maximumTaskCount = (maximum + 1) * (DIRECTIONS.has(directionDistribution) ? 1 : 2);
  if (!Number.isInteger(count) || count < 1 || count > maximumTaskCount) {
    throw new RangeError(`Počet úloh musí být celé číslo od 1 do ${maximumTaskCount}.`);
  }

  const directions = createDirections(directionDistribution, count);
  const tasks = [];

  for (const direction of DIRECTIONS) {
    const directionCount = directions.filter(taskDirection => taskDirection === direction).length;
    const values = Array.from({ length: maximum + 1 }, (_, value) => value);
    shuffle(values);

    for (const value of values.slice(0, directionCount)) {
      tasks.push({ value, direction });
    }
  }

  shuffle(tasks);

  return tasks.map(({ value, direction }, index) => ({
    id: index + 1,
    value,
    direction,
    evaluated: false,
    userAnswer: null,
    isCorrect: null,
  }));
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
}

function createDirections(distribution, count) {
  if (DIRECTIONS.has(distribution)) {
    return Array(count).fill(distribution);
  }

  const decToBinCount = distribution === "balanced"
    ? Math.ceil(count / 2)
    : distribution === "more-dec-to-bin"
      ? Math.round(count * 0.6)
      : count - Math.round(count * 0.6);
  const binToDecCount = count - decToBinCount;

  if (decToBinCount === 0 || binToDecCount === 0) {
    throw new RangeError("Test musí obsahovat oba směry převodu.");
  }

  return [
    ...Array(decToBinCount).fill("dec-to-bin"),
    ...Array(binToDecCount).fill("bin-to-dec"),
  ];
}

export function formatQuestion(task) {
  if (task.direction === "dec-to-bin") {
    return `Převeď číslo ${task.value}₁₀ do dvojkové soustavy.`;
  }

  if (task.direction === "bin-to-dec") {
    return `Převeď číslo ${task.value.toString(2)}₂ do desítkové soustavy.`;
  }

  throw new RangeError(`Neznámý typ převodu: ${task.direction}`);
}

export function checkAnswer(task, answer) {
  const trimmedAnswer = answer.trim();

  if (trimmedAnswer === "") {
    return { valid: false, message: "Zadej odpověď, než ji zkontroluješ." };
  }
  if (trimmedAnswer.startsWith("-")) {
    return { valid: false, message: "Záporná čísla nejsou platná. Zadej nezáporné celé číslo." };
  }

  const pattern = task.direction === "dec-to-bin"
    ? /^[01]+$/
    : task.direction === "bin-to-dec"
      ? /^[0-9]+$/
      : null;

  if (pattern === null) {
    throw new RangeError(`Neznámý typ převodu: ${task.direction}`);
  }
  if (!pattern.test(trimmedAnswer)) {
    const expectedCharacters = task.direction === "dec-to-bin"
      ? "Použij pouze číslice 0 a 1."
      : "Použij pouze číslice 0 až 9.";
    return { valid: false, message: expectedCharacters };
  }

  const expectedAnswer = task.direction === "dec-to-bin"
    ? task.value.toString(2)
    : String(task.value);
  const normalizedAnswer = trimmedAnswer.replace(/^0+(?=\d)/, "");
  const correct = normalizedAnswer === expectedAnswer;

  return {
    valid: true,
    correct,
    expectedAnswer,
    explanation: explainSolution(task),
  };
}

export function explainSolution(task) {
  if (task.direction === "dec-to-bin") {
    const divisionSteps = [];
    const remainders = [];
    let remaining = task.value;

    do {
      const quotient = Math.floor(remaining / 2);
      const remainder = remaining % 2;
      divisionSteps.push(`${remaining} ÷ 2 = ${quotient}, zbytek ${remainder}`);
      remainders.push(remainder);
      remaining = quotient;
    } while (remaining > 0);

    const binary = remainders.reverse().join("");
    return `Číslo opakovaně dělíme dvěma a zapisujeme zbytky: ${divisionSteps.join("; ")}. Zbytky čteme odspodu nahoru: ${binary}₂.`;
  }

  if (task.direction === "bin-to-dec") {
    const binary = task.value.toString(2);
    const terms = [...binary].reverse().map((bit, power) => {
      const superscriptPower = String(power).replace(/\d/g, digit => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]);
      return `${bit} × 2${superscriptPower}`;
    });

    return `Každou číslici vynásobíme odpovídající mocninou dvojky a výsledky sečteme: ${terms.join(" + ")} = ${task.value}.`;
  }

  throw new RangeError(`Neznámý typ převodu: ${task.direction}`);
}
