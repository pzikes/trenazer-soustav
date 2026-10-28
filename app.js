import { checkAnswer, explainSolution, formatQuestion, generateTasks } from "./questions.js";
import { clearHistory, loadHistory, saveResult } from "./storage.js";

const difficultySelect = document.querySelector("#difficulty");
const questionCountSelect = document.querySelector("#question-count");
const timeLimitSelect = document.querySelector("#time-limit");
const directionDistributionSelect = document.querySelector("#direction-distribution");
const generateButton = document.querySelector("#generate-button");
const startButton = document.querySelector("#start-button");
const printTestButton = document.querySelector("#print-test-button");
const printSolutionsButton = document.querySelector("#print-solutions-button");
const scoreDisplay = document.querySelector("#score");
const timerDisplay = document.querySelector("#timer");
const testProgress = document.querySelector("#test-progress");
const progressDescription = document.querySelector("#progress-description");
const quizSection = document.querySelector("#quiz");
const questionNumber = document.querySelector("#question-number");
const questionPrompt = document.querySelector("#question-prompt");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer-input");
const checkButton = document.querySelector("#check-button");
const answerFeedback = document.querySelector("#answer-feedback");
const answerResult = document.querySelector("#answer-result");
const correctAnswer = document.querySelector("#correct-answer");
const solutionExplanation = document.querySelector("#solution-explanation");
const nextButton = document.querySelector("#next-button");
const completionMessage = document.querySelector("#completion-message");
const timeExpiredMessage = document.querySelector("#time-expired-message");
const finalScore = document.querySelector("#final-score");
const finalPercentage = document.querySelector("#final-percentage");
const noMistakes = document.querySelector("#no-mistakes");
const mistakesList = document.querySelector("#mistakes-list");
const historyStatus = document.querySelector("#history-status");
const historyBody = document.querySelector("#history-body");
const historyEmpty = document.querySelector("#history-empty");
const historyChartWrapper = document.querySelector("#history-chart-wrapper");
const historyChart = document.querySelector("#history-chart");
const historyChartDescription = document.querySelector("#history-chart-description");
const clearHistoryButton = document.querySelector("#clear-history-button");
const printSheet = document.querySelector("#print-sheet");

let tasks = [];
let currentTaskIndex = 0;
let quizInProgress = false;
let timerDeadline = null;
let timerIntervalId = null;
let history = [];
let activeDifficulty = null;

const HISTORY_ERROR_MESSAGES = {
  unavailable: "Historie není dostupná. Prohlížeč nepovolil přístup k místnímu úložišti.",
  corrupt: "Uložená historie je poškozená. Po potvrzení ji můžeš smazat a začít znovu.",
  "write-failed": "Výsledek testu se nepodařilo uložit do historie.",
  "clear-failed": "Historii se nepodařilo smazat.",
  "invalid-result": "Výsledek testu nelze uložit, protože obsahuje neplatná data.",
};

function showHistoryError(error) {
  historyStatus.textContent = HISTORY_ERROR_MESSAGES[error]
    ?? "S historií se nepodařilo pracovat.";
  historyStatus.hidden = false;
}

function renderHistory(entries) {
  history = entries;
  historyBody.replaceChildren();
  historyEmpty.hidden = history.length > 0;
  renderHistoryChart();

  for (const entry of history) {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const difficultyCell = document.createElement("td");
    const scoreCell = document.createElement("td");
    const countCell = document.createElement("td");
    const percentageCell = document.createElement("td");

    dateCell.textContent = new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(entry.completedAt));
    difficultyCell.textContent = {
      easy: "Lehká",
      medium: "Střední",
      hard: "Těžká",
    }[entry.difficulty];
    scoreCell.textContent = String(entry.score);
    countCell.textContent = String(entry.questionCount);
    percentageCell.textContent = `${entry.percentage} %`;

    row.append(dateCell, difficultyCell, scoreCell, countCell, percentageCell);
    historyBody.append(row);
  }
}

function renderHistoryChart() {
  const chartEntries = [...history].reverse();
  historyChartWrapper.hidden = chartEntries.length === 0;
  historyChart.querySelectorAll(".chart-content").forEach(element => element.remove());

  if (chartEntries.length === 0) {
    historyChartDescription.textContent = "";
    return;
  }

  const namespace = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(namespace, "g");
  group.setAttribute("class", "chart-content");

  const chart = { left: 52, right: 620, top: 20, bottom: 252 };
  const plotHeight = chart.bottom - chart.top;
  const plotWidth = chart.right - chart.left;

  for (const tick of [0, 25, 50, 75, 100]) {
    const y = chart.bottom - (tick / 100) * plotHeight;
    const gridLine = document.createElementNS(namespace, "line");
    gridLine.setAttribute("x1", String(chart.left));
    gridLine.setAttribute("x2", String(chart.right));
    gridLine.setAttribute("y1", String(y));
    gridLine.setAttribute("y2", String(y));
    gridLine.setAttribute("class", "chart-grid-line");
    group.append(gridLine);

    const tickLabel = document.createElementNS(namespace, "text");
    tickLabel.setAttribute("x", String(chart.left - 10));
    tickLabel.setAttribute("y", String(y + 4));
    tickLabel.setAttribute("text-anchor", "end");
    tickLabel.setAttribute("class", "chart-axis-label");
    tickLabel.textContent = `${tick}%`;
    group.append(tickLabel);
  }

  const slotWidth = plotWidth / chartEntries.length;
  const barWidth = Math.min(34, slotWidth * 0.62);
  const chartLabels = [];

  chartEntries.forEach((entry, index) => {
    const x = chart.left + slotWidth * index + (slotWidth - barWidth) / 2;
    const barHeight = (entry.percentage / 100) * plotHeight;
    const y = chart.bottom - barHeight;
    const testNumber = index + 1;
    chartLabels.push(`Test ${testNumber}: ${entry.percentage} %`);

    const bar = document.createElementNS(namespace, "rect");
    bar.setAttribute("x", String(x));
    bar.setAttribute("y", String(y));
    bar.setAttribute("width", String(barWidth));
    bar.setAttribute("height", String(barHeight));
    bar.setAttribute("rx", "4");
    bar.setAttribute("class", "chart-bar");
    bar.setAttribute("aria-label", `Test ${testNumber}: ${entry.percentage} %`);
    group.append(bar);

    const percentageLabel = document.createElementNS(namespace, "text");
    percentageLabel.setAttribute("x", String(x + barWidth / 2));
    percentageLabel.setAttribute("y", String(Math.max(chart.top + 12, y - 6)));
    percentageLabel.setAttribute("text-anchor", "middle");
    percentageLabel.setAttribute("class", "chart-value-label");
    percentageLabel.textContent = `${entry.percentage}%`;
    group.append(percentageLabel);

    const testLabel = document.createElementNS(namespace, "text");
    testLabel.setAttribute("x", String(x + barWidth / 2));
    testLabel.setAttribute("y", String(chart.bottom + 22));
    testLabel.setAttribute("text-anchor", "middle");
    testLabel.setAttribute("class", "chart-axis-label");
    testLabel.textContent = `Test ${testNumber}`;
    group.append(testLabel);
  });

  const yAxisLabel = document.createElementNS(namespace, "text");
  yAxisLabel.setAttribute("x", "14");
  yAxisLabel.setAttribute("y", String(chart.top + plotHeight / 2));
  yAxisLabel.setAttribute("text-anchor", "middle");
  yAxisLabel.setAttribute("class", "chart-axis-title");
  yAxisLabel.setAttribute("transform", `rotate(-90 14 ${chart.top + plotHeight / 2})`);
  yAxisLabel.textContent = "Úspěšnost";
  group.append(yAxisLabel);

  const xAxisLabel = document.createElementNS(namespace, "text");
  xAxisLabel.setAttribute("x", String(chart.left + plotWidth / 2));
  xAxisLabel.setAttribute("y", "306");
  xAxisLabel.setAttribute("text-anchor", "middle");
  xAxisLabel.setAttribute("class", "chart-axis-title");
  xAxisLabel.textContent = "Jednotlivé testy (od nejstaršího)";
  group.append(xAxisLabel);

  historyChart.append(group);
  historyChartDescription.textContent = `Sloupcový graf úspěšnosti v chronologickém pořadí. ${chartLabels.join(". ")}. Osa Y zobrazuje procentuální úspěšnost od 0 do 100 procent.`;
}

function refreshHistory() {
  const result = loadHistory();
  renderHistory(result.history);
  historyStatus.hidden = result.ok;
  if (!result.ok) {
    showHistoryError(result.error);
  }
}

function updateScore() {
  const evaluatedTasks = tasks.filter(task => task.evaluated);
  const correctAnswers = evaluatedTasks.filter(task => task.isCorrect).length;
  scoreDisplay.textContent = `Skóre: ${correctAnswers} / ${tasks.length}`;
}

function updateProgress() {
  const completedTasks = tasks.filter(task => task.evaluated).length;
  testProgress.max = tasks.length;
  testProgress.value = completedTasks;
  progressDescription.textContent = `Vyhodnoceno ${completedTasks} z ${tasks.length} úloh`;
}

function renderResults(timeExpired) {
  const correctAnswers = tasks.filter(task => task.isCorrect).length;
  const mistakes = tasks.filter(task => !task.isCorrect);
  const percentage = Math.round((correctAnswers / tasks.length) * 100);

  timeExpiredMessage.hidden = !timeExpired;
  finalScore.textContent = `Celkové skóre: ${correctAnswers} z ${tasks.length}`;
  finalPercentage.textContent = `Úspěšnost: ${percentage} %`;
  noMistakes.hidden = mistakes.length > 0;
  mistakesList.hidden = mistakes.length === 0;
  mistakesList.replaceChildren();

  for (const task of mistakes) {
    const item = document.createElement("li");
    const question = formatQuestion(task);
    const expectedAnswer = task.direction === "dec-to-bin"
      ? `${task.value.toString(2)}₂`
      : `${task.value}₁₀`;
    const userAnswer = task.userAnswer === null
      ? "Nezodpovězeno"
      : `Tvoje odpověď: ${task.userAnswer}`;
    item.textContent = `${question} ${userAnswer}. Správná odpověď: ${expectedAnswer}.`;
    mistakesList.append(item);
  }
}

function renderCurrentTask() {
  const task = tasks[currentTaskIndex];
  questionNumber.textContent = `Úloha ${currentTaskIndex + 1} z ${tasks.length}`;
  questionPrompt.textContent = formatQuestion(task);
  updateScore();
  updateProgress();
  answerInput.value = "";
  answerInput.disabled = false;
  checkButton.disabled = false;
  nextButton.disabled = true;
  answerFeedback.hidden = true;
  answerFeedback.classList.remove("is-correct", "is-incorrect");
  nextButton.textContent = currentTaskIndex === tasks.length - 1
    ? "Dokončit"
    : "Další úloha";
  answerInput.focus();
}

function submitAnswer(event) {
  event.preventDefault();
  if (timerDeadline !== null && Date.now() >= timerDeadline) {
    finishQuiz(true);
    return;
  }

  const task = tasks[currentTaskIndex];
  if (!quizInProgress || task.evaluated) {
    return;
  }

  const result = checkAnswer(task, answerInput.value);
  answerFeedback.hidden = false;

  if (!result.valid) {
    answerFeedback.classList.remove("is-correct", "is-incorrect");
    answerResult.textContent = result.message;
    correctAnswer.textContent = "";
    solutionExplanation.textContent = "";
    answerInput.focus();
    return;
  }

  task.evaluated = true;
  task.userAnswer = answerInput.value.trim();
  task.isCorrect = result.correct;
  updateScore();
  updateProgress();
  answerFeedback.classList.toggle("is-correct", result.correct);
  answerFeedback.classList.toggle("is-incorrect", !result.correct);
  answerResult.textContent = result.correct
    ? "Správně!"
    : "To není správná odpověď.";
  correctAnswer.textContent = `Správná odpověď: ${result.expectedAnswer}${task.direction === "dec-to-bin" ? "₂" : "₁₀"}`;
  solutionExplanation.textContent = result.explanation;
  answerInput.disabled = true;
  checkButton.disabled = true;
  nextButton.disabled = false;
  nextButton.focus();
}

function generateTest() {
  if (quizInProgress) {
    return;
  }

  tasks = generateTasks(
    difficultySelect.value,
    directionDistributionSelect.value,
    Number(questionCountSelect.value),
  );
  currentTaskIndex = 0;
  updateProgress();
  startButton.disabled = false;
  printTestButton.disabled = false;
  printSolutionsButton.disabled = false;
  completionMessage.hidden = true;
  quizSection.hidden = true;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updateTimer() {
  const remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
  timerDisplay.textContent = `Zbývající čas: ${formatTime(remainingSeconds)}`;
  timerDisplay.classList.toggle("is-warning", remainingSeconds <= 30);

  if (remainingSeconds === 0) {
    finishQuiz(true);
  }
}

function startTimer() {
  const timeLimitMinutes = Number(timeLimitSelect.value);
  if (timeLimitMinutes === 0) {
    timerDisplay.classList.remove("is-warning");
    timerDisplay.hidden = true;
    return;
  }

  timerDisplay.classList.remove("is-warning");
  timerDisplay.hidden = false;
  timerDeadline = Date.now() + timeLimitMinutes * 60 * 1000;
  timerIntervalId = window.setInterval(updateTimer, 1000);
  updateTimer();
}

function startQuiz() {
  if (quizInProgress || tasks.length === 0) {
    return;
  }

  currentTaskIndex = 0;
  activeDifficulty = difficultySelect.value;
  quizInProgress = true;
  generateButton.disabled = true;
  startButton.disabled = true;
  difficultySelect.disabled = true;
  questionCountSelect.disabled = true;
  timeLimitSelect.disabled = true;
  directionDistributionSelect.disabled = true;
  printTestButton.disabled = true;
  printSolutionsButton.disabled = true;
  completionMessage.hidden = true;
  quizSection.hidden = false;
  startTimer();
  renderCurrentTask();
}

function finishQuiz(timeExpired = false) {
  if (!quizInProgress) {
    return;
  }

  quizInProgress = false;
  if (timerIntervalId !== null) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  timerDeadline = null;
  timerDisplay.classList.remove("is-warning");
  timerDisplay.hidden = true;
  generateButton.disabled = false;
  startButton.disabled = true;
  difficultySelect.disabled = false;
  questionCountSelect.disabled = false;
  timeLimitSelect.disabled = false;
  directionDistributionSelect.disabled = false;
  printTestButton.disabled = false;
  printSolutionsButton.disabled = false;
  quizSection.hidden = true;
  renderResults(timeExpired);
  completionMessage.hidden = false;

  const score = tasks.filter(task => task.isCorrect).length;
  const result = saveResult({
    difficulty: activeDifficulty,
    score,
    questionCount: tasks.length,
  });
  if (result.ok) {
    renderHistory(result.history);
    historyStatus.hidden = true;
  } else {
    showHistoryError(result.error);
  }
}

function showNextTask() {
  if (timerDeadline !== null && Date.now() >= timerDeadline) {
    finishQuiz(true);
    return;
  }

  if (!quizInProgress || nextButton.disabled) {
    return;
  }
  if (currentTaskIndex === tasks.length - 1) {
    finishQuiz();
    return;
  }

  currentTaskIndex += 1;
  renderCurrentTask();
}

function invalidateGeneratedTest() {
  if (quizInProgress || tasks.length === 0) {
    return;
  }

  tasks = [];
  startButton.disabled = true;
  printTestButton.disabled = true;
  printSolutionsButton.disabled = true;
  completionMessage.hidden = true;
}

function renderPrintSheet(includeSolutions) {
  printSheet.replaceChildren();
  const heading = document.createElement("h1");
  heading.textContent = includeSolutions ? "Řešení testu" : "Test číselných soustav";
  printSheet.append(heading);

  const details = document.createElement("p");
  const timeLimit = timeLimitSelect.value === "0"
    ? "bez časového limitu"
    : `${timeLimitSelect.value} minut`;
  details.textContent = `Obtížnost: ${difficultySelect.selectedOptions[0].textContent} · Počet otázek: ${tasks.length} · Čas: ${timeLimit}`;
  printSheet.append(details);

  if (!includeSolutions) {
    const student = document.createElement("p");
    student.className = "print-student-line";
    student.textContent = "Jméno: ____________________________________   Datum: ______________";
    printSheet.append(student);
  }

  const list = document.createElement("ol");
  for (const task of tasks) {
    const item = document.createElement("li");
    const prompt = document.createElement("p");
    prompt.textContent = formatQuestion(task);
    item.append(prompt);

    if (includeSolutions) {
      const answer = document.createElement("p");
      answer.className = "print-answer";
      answer.textContent = `Správná odpověď: ${task.direction === "dec-to-bin" ? `${task.value.toString(2)}₂` : `${task.value}₁₀`}`;
      const explanation = document.createElement("p");
      explanation.textContent = explainSolution(task);
      item.append(answer, explanation);
    } else {
      const answerLine = document.createElement("p");
      answerLine.className = "print-answer-line";
      answerLine.textContent = "Odpověď: __________________________________________________";
      item.append(answerLine);
    }

    list.append(item);
  }
  printSheet.append(list);
}

function printTest(includeSolutions) {
  if (tasks.length === 0 || quizInProgress) {
    return;
  }

  renderPrintSheet(includeSolutions);
  printSheet.hidden = false;
  window.print();
}

function clearPrintSheet() {
  printSheet.hidden = true;
}

function handleClearHistory() {
  if (!window.confirm("Opravdu chceš smazat celou historii dokončených testů?")) {
    return;
  }

  const result = clearHistory();
  if (result.ok) {
    renderHistory(result.history);
    historyStatus.hidden = true;
  } else {
    showHistoryError(result.error);
  }
}

generateButton.addEventListener("click", generateTest);
startButton.addEventListener("click", startQuiz);
printTestButton.addEventListener("click", () => printTest(false));
printSolutionsButton.addEventListener("click", () => printTest(true));
answerForm.addEventListener("submit", submitAnswer);
nextButton.addEventListener("click", showNextTask);
difficultySelect.addEventListener("change", invalidateGeneratedTest);
questionCountSelect.addEventListener("change", invalidateGeneratedTest);
timeLimitSelect.addEventListener("change", invalidateGeneratedTest);
directionDistributionSelect.addEventListener("change", invalidateGeneratedTest);
clearHistoryButton.addEventListener("click", handleClearHistory);
window.addEventListener("afterprint", clearPrintSheet);

refreshHistory();
