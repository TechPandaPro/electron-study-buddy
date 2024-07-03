(async () => {
  const electronStore = window.electronAPI.electronStore;

  const questions = (await electronStore.get(`questions`)) ?? [];

  const questionElem = document.getElementById("question");
  const answerElem = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");
  const unsureBtn = document.getElementById("unsureBtn");

  const question = questions[getRandomInt(0, questions.length)];

  questionElem.innerText = question.question;

  answerElem.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitBtn.click();
  });

  submitBtn.addEventListener("click", () => {
    // TODO: handle correct/incorrect answers
    const providedAnswer = answerElem.value;
    if (providedAnswer === question.answer) {
      alert("correct");
    } else {
      alert("incorrect");
    }
  });

  unsureBtn.addEventListener("click", () => {
    // TODO: handle unsure button
    alert("coming soon");
  });

  answerElem.focus();

  console.log(question);

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  // min is inclusive and max is exclusive
  function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }
})();
