(async () => {
  // FIXME: consider adding class to body while loading that disables transitions

  const electronAPI = window.electronAPI;
  const electronStore = electronAPI.electronStore;

  const questionsBody = document.querySelector("#questions tbody");
  const flipQuestionsBtn = document.getElementById("flipQuestionsBtn");
  const saveBtn = document.getElementById("saveBtn");
  const saveBtnCheck = document.getElementById("saveBtnCheck");
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

  // fetch dashboard config data
  let popQuizConfig;
  let questions;
  await updateSavedCachedData();

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

    removeBtn.addEventListener("click", () => {
      newRow.remove();
      checkNeedsSave();
    });

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
    checkNeedsSave();
  });

  let saveBtnCheckTimeout = null;

  saveBtn.addEventListener("click", async () => {
    const dataToSave = retrieveDataToSave(true);
    await electronStore.set("popQuizConfig", dataToSave.popQuizConfig);
    await electronStore.set("questions", dataToSave.questions);
    await updateSavedCachedData(dataToSave);
    checkNeedsSave();
    saveBtnCheck.dataset.show = true;

    if (saveBtnCheckTimeout) clearTimeout(saveBtnCheckTimeout);
    saveBtnCheckTimeout = setTimeout(() => {
      if (saveBtnCheck.dataset.show) delete saveBtnCheck.dataset.show;
      saveBtnCheckTimeout = null;
    }, 1250);
  });

  function retrieveSavedCachedData() {
    return { popQuizConfig, questions };
  }

  async function updateSavedCachedData(data = {}) {
    if (data.popQuizConfig) popQuizConfig = data.popQuizConfig;
    else
      popQuizConfig = (await electronStore.get("popQuizConfig")) ?? {
        enabled: false,
        intervalCount: 2,
        time: 1,
      };

    if (data.questions) questions = data.questions;
    else questions = (await electronStore.get("questions")) ?? [];

    return { popQuizConfig, questions };
  }

  function retrieveDataToSave(updateInterface) {
    const questionElems = questionsBody.querySelectorAll("tr.questionInputs");
    let questions = Array.from(questionElems).map((question) => ({
      question: question.querySelector(".questionInput").value,
      answer: question.querySelector(".answerInput").value,
      elem: question,
    }));

    if (updateInterface) {
      for (let i = 0; i < questions.length - 1; i++) {
        const question = questions[i];
        if (!question.question || !question.answer)
          question.elem.querySelector(".removeBtn").click();
      }
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

    return { popQuizConfig, questions };
  }

  quizDemoBtn.addEventListener("click", () => electronAPI.startQuiz());

  // when any input is changed, check if the save button needs to be emphasized
  document.addEventListener("input", checkNeedsSave);

  function checkNeedsSave() {
    if (saveBtnCheckTimeout) clearTimeout(saveBtnCheckTimeout);
    if (saveBtnCheck.dataset.show) delete saveBtnCheck.dataset.show;

    const oldData = JSON.stringify(retrieveSavedCachedData());
    const newData = JSON.stringify(retrieveDataToSave());

    const needsSave = oldData !== newData;

    if (needsSave) saveBtn.dataset.needsSave = true;
    else delete saveBtn.dataset.needsSave;

    electronAPI.setNeedsSave(needsSave);
  }

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
