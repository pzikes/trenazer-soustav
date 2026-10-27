import { checkAnswer, formatQuestion, generateTasks } from "./questions.js";

const difficultySelect = document.querySelector("#difficulty");
const directionSelect = document.querySelector("#direction");
const startButton = document.querySelector("#start-button");
const scoreDisplay = document.querySelector("#score");
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
const finalScore = document.querySelector("#final-score");
const finalPercentage = document.querySelector("#final-percentage");
const noMistakes = document.querySelector("#no-mistakes");
const mistakesList = document.querySelector("#mistakes-list");

let tasks = [];
let currentTaskIndex = 0;
let quizInProgress = false;

function updateScore() {
  const evaluatedTasks = tasks.filter(task => task.evaluated);
  const correctAnswers = evaluatedTasks.filter(task => task.isCorrect).length;
  scoreDisplay.textContent = `Skóre: ${correctAnswers} / ${tasks.length}`;
}

function renderResults() {
  const correctAnswers = tasks.filter(task => task.isCorrect).length;
  const mistakes = tasks.filter(task => !task.isCorrect);
  const percentage = Math.round((correctAnswers / tasks.length) * 100);

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
    item.textContent = `${question} Tvoje odpověď: ${task.userAnswer}. Správná odpověď: ${expectedAnswer}.`;
    mistakesList.append(item);
  }
}

function renderCurrentTask() {
  const task = tasks[currentTaskIndex];
  questionNumber.textContent = `Úloha ${currentTaskIndex + 1} z ${tasks.length}`;
  questionPrompt.textContent = formatQuestion(task);
  updateScore();
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
  const task = tasks[currentTaskIndex];
  if (task.evaluated) {
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

function startQuiz() {
  if (quizInProgress) {
    return;
  }

  tasks = generateTasks(difficultySelect.value, directionSelect.value);
  currentTaskIndex = 0;
  quizInProgress = true;
  startButton.disabled = true;
  difficultySelect.disabled = true;
  directionSelect.disabled = true;
  completionMessage.hidden = true;
  quizSection.hidden = false;
  renderCurrentTask();
}

function showNextTask() {
  if (currentTaskIndex === tasks.length - 1) {
    quizInProgress = false;
    startButton.disabled = false;
    difficultySelect.disabled = false;
    directionSelect.disabled = false;
    quizSection.hidden = true;
    renderResults();
    completionMessage.hidden = false;
    return;
  }

  currentTaskIndex += 1;
  renderCurrentTask();
}

startButton.addEventListener("click", startQuiz);
answerForm.addEventListener("submit", submitAnswer);
nextButton.addEventListener("click", showNextTask);
