(async () => {
  const electronStore = window.electronAPI.electronStore;

  const questionsBody = document.querySelector("#questions tbody");
  const flipQuestionsBtn = document.getElementById("flipQuestionsBtn");
  const saveBtn = document.getElementById("saveBtn");
  const quizDemoBtn = document.getElementById("quizDemoBtn");

  const popQuizzesEnabledElem = document.getElementById("popQuizzesEnabled");
  const popQuizIntervalCountElem = document.getElementById(
    "popQuizIntervalCount"
  );
  const popQuizIntervalTimeElem = document.getElementById(
    "popQuizIntervalTime"
  );
  const popQuizIntervalContainer = document.getElementById(
    "popQuizIntervalContainer"
  );

  const popQuizConfig = (await electronStore.get("popQuizConfig")) ?? {};
  const questions = (await electronStore.get("questions")) ?? [];

  popQuizzesEnabledElem.checked = popQuizConfig.enabled;
  popQuizIntervalCountElem.value = popQuizConfig.intervalCount;
  popQuizIntervalTimeElem.value = popQuizConfig.intervalTime;

  for (const question of questions) addRow(question.question, question.answer);

  addRow();

  function addRow(question, answer) {
    const newRow = document.createElement("tr");
    newRow.classList.add("questionInputs");
    newRow.innerHTML = `
      <td><div class="customInputWrapper"><input class="customInput questionInput" placeholder="bonjour" /></div></td>
      <td><div class="customInputWrapper"><input class="customInput answerInput" placeholder="hello" /></div></td>
      <td>
        <button class="removeBtn" aria-label="Remove">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 11L129 129" stroke="currentColor" stroke-width="22" stroke-linecap="round"/>
            <path d="M11 129L129 11" stroke="currentColor" stroke-width="22" stroke-linecap="round"/>
          </svg>
        </button>
      </td>
    `;

    const questionInput = newRow.querySelector(".questionInput");
    const answerInput = newRow.querySelector(".answerInput");
    const removeBtn = newRow.querySelector(".removeBtn");

    if (question) questionInput.value = question;
    if (answer) answerInput.value = answer;

    questionInput.addEventListener("focus", checkFocus);
    answerInput.addEventListener("focus", checkFocus);

    questionInput.addEventListener("blur", checkFocus);
    answerInput.addEventListener("blur", checkFocus);

    questionInput.addEventListener("input", checkValues);
    answerInput.addEventListener("input", checkValues);

    removeBtn.addEventListener("click", () => newRow.remove());

    questionsBody.appendChild(newRow);

    function checkValues() {
      const allInputs = Array.from(
        questionsBody.querySelectorAll("tr.questionInputs")
      );
      const index = allInputs.indexOf(newRow);
      if (
        index === allInputs.length - 1 &&
        (questionInput.value || answerInput.value)
      )
        addRow();
    }

    function checkFocus(e) {
      const elem = e.target;
      const elemParent = elem.parentElement;
      if (document.activeElement === elem) elemParent.dataset.focus = true;
      else delete elemParent.dataset.focus;
    }
  }

  repositionFlipQuestionsBtn();

  window.addEventListener("resize", repositionFlipQuestionsBtn);

  function repositionFlipQuestionsBtn() {
    const firstCellBoundingRect = questionsBody
      .querySelector(".questionInputs td")
      .getBoundingClientRect();
    flipQuestionsBtn.style.left = `${firstCellBoundingRect.width}px`;
    flipQuestionsBtn.style.top = `${firstCellBoundingRect.height / 2 + 5}px`;
  }

  flipQuestionsBtn.addEventListener("click", () => {
    const questionElems = questionsBody.querySelectorAll("tr.questionInputs");
    for (const question of questionElems) {
      const questionElem = question.querySelector(".questionInput");
      const answerElem = question.querySelector(".answerInput");

      const questionVal = questionElem.value;
      const answerVal = answerElem.value;

      questionElem.value = answerVal;
      answerElem.value = questionVal;
    }
  });

  saveBtn.addEventListener("click", async () => {
    const questionElems = questionsBody.querySelectorAll("tr.questionInputs");
    let questions = Array.from(questionElems).map((question) => ({
      question: question.querySelector(".questionInput").value,
      answer: question.querySelector(".answerInput").value,
      elem: question,
    }));

    for (let i = 0; i < questions.length - 1; i++) {
      const question = questions[i];
      if (!question.question || !question.answer)
        question.elem.querySelector(".removeBtn").click();
    }

    questions = questions.filter(
      (question) => question.question && question.answer
    );

    questions = questions.map((question) => ({
      question: question.question,
      answer: question.answer,
    }));

    const popQuizConfig = {
      enabled: popQuizzesEnabledElem.checked,
      intervalCount: Number(popQuizIntervalCountElem.value),
      intervalTime: Number(popQuizIntervalTimeElem.value),
    };

    await electronStore.set("popQuizConfig", popQuizConfig);
    await electronStore.set("questions", questions);

    return questions;
  });

  quizDemoBtn.addEventListener("click", () => window.electronAPI.startQuiz());

  updatePopQuizIntervalEnabled();

  popQuizzesEnabledElem.addEventListener("input", updatePopQuizIntervalEnabled);

  function updatePopQuizIntervalEnabled() {
    const popQuizzesEnabled = popQuizzesEnabledElem.checked;

    if (popQuizzesEnabled) delete popQuizIntervalContainer.dataset.disabled;
    else popQuizIntervalContainer.dataset.disabled = true;

    const inputElems = popQuizIntervalContainer.querySelectorAll("select");
    for (const inputElem of inputElems) inputElem.disabled = !popQuizzesEnabled;
  }

  // window.electronAPI.startQuiz();
})();
