(async () => {
  // FIXME: consider adding class to body while loading that disables transitions

  const electronAPI = window.electronAPI;
  const electronStore = electronAPI.electronStore;

  const mainDashboardContainer = document.querySelector(".dashboardContainer");

  const aiQuestionAssistBtn = document.getElementById("aiQuestionAssistBtn");

  const questionsBody = document.querySelector("#questions tbody");
  const flipQuestionsBtn = document.getElementById("flipQuestionsBtn");
  const saveBtn = document.getElementById("saveBtn");
  const saveBtnCheck = document.getElementById("saveBtnCheck");
  const quizDemoBtn = document.getElementById("quizDemoBtn");
  const flashcardsBtn = document.getElementById("flashcardsBtn");

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
  const popQuizQuestionCount = document.getElementById("popQuizQuestionCount");

  const ignorePunctuation = document.getElementById("ignorePunctuation");
  const ignoreAccentMarks = document.getElementById("ignoreAccentMarks");
  const ignoreCapitalization = document.getElementById("ignoreCapitalization");

  const quizShowIncorrect = document.getElementById("quizShowIncorrect");

  // fetch dashboard config data
  let popQuizConfig;
  let questions;
  await updateSavedCachedData();

  resetDisplayedConfig();

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

    questionInput.addEventListener("input", () => {
      updateQuestionCountSelect();
      checkValues();
    });
    answerInput.addEventListener("input", () => {
      updateQuestionCountSelect();
      checkValues();
    });

    questionInput.addEventListener("change", () => {
      questionInput.value = questionInput.value.trim();
    });
    answerInput.addEventListener("change", () => {
      answerInput.value = answerInput.value.trim();
    });

    removeBtn.addEventListener("click", () => {
      newRow.remove();
      updateQuestionCountSelect();
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
    const popQuizConfigDefaults = {
      enabled: false,
      intervalCount: 2,
      intervalTime: 1,
      questionCount: 3,
      ignorePunctuation: false,
      ignoreAccentMarks: false,
      ignoreCapitalization: true,
      showIncorrect: false,
    };

    if (data.popQuizConfig) popQuizConfig = data.popQuizConfig;
    else popQuizConfig = (await electronStore.get("popQuizConfig")) ?? {};

    for (const defaultKey in popQuizConfigDefaults)
      if (!(defaultKey in popQuizConfig))
        popQuizConfig[defaultKey] = popQuizConfigDefaults[defaultKey];

    if (data.questions) questions = data.questions;
    else questions = (await electronStore.get("questions")) ?? [];

    return { popQuizConfig, questions };
  }

  function retrieveDataToSave(updateInterface) {
    const questionElems = questionsBody.querySelectorAll("tr.questionInputs");
    let questions = Array.from(questionElems).map((question) => ({
      question: question.querySelector(".questionInput").value.trim(),
      answer: question.querySelector(".answerInput").value.trim(),
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
      questionCount: Number(popQuizQuestionCount.value),
      ignorePunctuation: ignorePunctuation.checked,
      ignoreAccentMarks: ignoreAccentMarks.checked,
      ignoreCapitalization: ignoreCapitalization.checked,
      showIncorrect: quizShowIncorrect.checked,
    };

    return { popQuizConfig, questions };
  }

  function resetDisplayedConfig() {
    popQuizzesEnabledElem.checked = popQuizConfig.enabled;
    popQuizIntervalCountElem.value = popQuizConfig.intervalCount;
    popQuizIntervalTimeElem.value = popQuizConfig.intervalTime;
    popQuizQuestionCount.value = popQuizConfig.questionCount;
    ignorePunctuation.checked = popQuizConfig.ignorePunctuation;
    ignoreAccentMarks.checked = popQuizConfig.ignoreAccentMarks;
    ignoreCapitalization.checked = popQuizConfig.ignoreCapitalization;
    quizShowIncorrect.checked = popQuizConfig.showIncorrect;

    for (const row of document.querySelectorAll(".questionInputs"))
      row.remove();

    for (const question of questions)
      addRow(question.question, question.answer);

    addRow();
  }

  quizDemoBtn.addEventListener("click", () => electronAPI.startQuiz());

  flashcardsBtn.addEventListener("click", () => electronAPI.startFlashcards());

  electronAPI.onResetUnsaved(() => {
    console.log("Reset");
    resetDisplayedConfig();
    checkNeedsSave();
  });

  updateQuestionCountSelect();

  // when any input is changed, check if the save button needs to be emphasized
  document.addEventListener("input", checkNeedsSave);

  function updateQuestionCountSelect() {
    // const questionCount =
    //   questionsBody.querySelectorAll("tr.questionInputs").length;

    const questionCount = Array.from(
      questionsBody.querySelectorAll("tr.questionInputs")
    ).filter(
      (row) =>
        row.querySelector(".questionInput").value.trim() &&
        row.querySelector(".answerInput").value.trim()
    ).length;

    const targetOptions = popQuizQuestionCount.querySelectorAll("option");
    for (const targetOption of targetOptions) {
      const optionValue = Number(targetOption.value);
      if (optionValue === 0) targetOption.innerHTML = `Max (${questionCount})`;
      // FIXME: this might be unnecessary. maybe allow duplicates?
      else targetOption.disabled = optionValue > questionCount;
    }
  }

  function checkNeedsSave() {
    if (saveBtnCheckTimeout) clearTimeout(saveBtnCheckTimeout);
    if (saveBtnCheck.dataset.show) delete saveBtnCheck.dataset.show;

    // const oldData = JSON.stringify(retrieveSavedCachedData());
    // const newData = JSON.stringify(retrieveDataToSave());

    // console.log(`old: ${oldData}`);
    // console.log(`new: ${newData}`);

    // const needsSave = oldData !== newData;

    const needsSave = !objectsDeepEqual(
      retrieveSavedCachedData(),
      retrieveDataToSave()
    );

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

  aiQuestionAssistBtn.addEventListener("click", () => {
    const aiAssistOverlay = document.createElement("div");
    aiAssistOverlay.classList.add("aiAssistOverlay");

    aiAssistOverlay.innerHTML = `
      <div class="dashboardContainer">
        <h1>AI Question Assist</h1>
        <button class="exitAssistBtn" aria-label="Exit">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
          </svg>
        </button>
        <div class="aiQuestionAssistItemsWrapper">
          <div class="openAiApiKeyContainer">
            <label for="openAiApiKey" class="styledLabel">OpenAI API Key:</label>
            <input type="password" class="styledTextInput" id="openAiApiKey" placeholder="sk-..." />
          </div>
          <div class="genFromImgContainer">
            <div class="genFromImgBeforeContainer">
              <button class="styledButton" id="genFromImgBtn">Generate Questions from Image</button>
            </div>
            <div class="genFromImgAfterContainer hidden">
              <div>
                <input type="file" id="genFile" accept=".png, .jpeg, .jpg, .webp" multiple />
                <label for="genFile" class="styledButton">Upload File</label>
              </div>
              <div id="filePreviews" class="hidden"></div>
              <div id="questionPreviews" class="hidden">
                <div id="questionPreviewsInner"></div>
              </div>
              <div>
                <label for="customInstructions" class="styledLabel">Custom Instructions:</label>
                <div class="additionalContext">Custom instructions are useful if you want to refine the generated questions to better match your use case. These instructions will be sent to GPT when generating questions.</div>
                <textarea id="customInstructions" class="styledTextarea" rows="3" placeholder="Example: Only pull from the vocabulary section of the material. Indented lines are continuations of previous lines."></textarea>
                <!-- <input type="text" id="customInstructions" class="styledTextInput" /> -->
              </div>
              <div>
                <input type="checkbox" id="createNewQuestions" />
                <label for="createNewQuestions">Create New Questions</label>
                <div class="additionalConfigContext">AI Question Assist can create new questions based upon the content within your image. If unselected, questions will only be pulled directly from the content within the image. (The former ensures more versatility, whereas the latter ensures better accuracy and relevance.)</div>
              </div>
              <div class="genFromImgFinalContainer">
                <button class="styledButton" id="genFinalBtn">Generate</button>
                <button class="styledButton" id="cancelFinalBtn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
        <!-- <div class="scrollDetectTop"></div>
        <div class="scrollDetectBottom"></div> -->
      </div>
    `;

    const exitAssistBtn = aiAssistOverlay.querySelector(".exitAssistBtn");
    exitAssistBtn.addEventListener("click", () => {
      aiAssistOverlay.remove();
    });

    const openAiApiKeyInput = aiAssistOverlay.querySelector("#openAiApiKey");
    const customInstructions = aiAssistOverlay.querySelector(
      "#customInstructions"
    );

    // const genFromImgContainer = aiAssistOverlay.querySelector(
    //   ".genFromImgContainer"
    // );

    const genFromImgBeforeContainer = aiAssistOverlay.querySelector(
      ".genFromImgBeforeContainer"
    );
    const genFromImgAfterContainer = aiAssistOverlay.querySelector(
      ".genFromImgAfterContainer"
    );

    const genFromImgBtn =
      genFromImgBeforeContainer.querySelector("#genFromImgBtn");

    const genFile = genFromImgAfterContainer.querySelector("#genFile");
    const filePreviews =
      genFromImgAfterContainer.querySelector("#filePreviews");
    const questionPreviews =
      genFromImgAfterContainer.querySelector("#questionPreviews");
    const questionPreviewsInner = genFromImgAfterContainer.querySelector(
      "#questionPreviewsInner"
    );
    const createNewQuestions = genFromImgAfterContainer.querySelector(
      "#createNewQuestions"
    );
    const genFinalBtn = genFromImgAfterContainer.querySelector("#genFinalBtn");
    const cancelFinalBtn =
      genFromImgAfterContainer.querySelector("#cancelFinalBtn");

    // TODO: maybe stop scrolling once reaching top/bottom of chart

    electronStore
      .get("aiQuestionAssistConfig")
      .then((aiQuestionAssistConfig = {}) => {
        if (aiQuestionAssistConfig.openAiApiKey)
          openAiApiKeyInput.value = aiQuestionAssistConfig.openAiApiKey;
        if (aiQuestionAssistConfig.customInstructions)
          customInstructions.value = aiQuestionAssistConfig.customInstructions;
      });

    openAiApiKeyInput.addEventListener("change", async () => {
      const aiQuestionAssistConfig =
        (await electronStore.get("aiQuestionAssistConfig")) ?? {};
      aiQuestionAssistConfig.openAiApiKey = openAiApiKeyInput.value;
      await electronStore.set("aiQuestionAssistConfig", aiQuestionAssistConfig);
    });

    customInstructions.addEventListener("change", async () => {
      const aiQuestionAssistConfig =
        (await electronStore.get("aiQuestionAssistConfig")) ?? {};
      aiQuestionAssistConfig.customInstructions = customInstructions.value;
      await electronStore.set("aiQuestionAssistConfig", aiQuestionAssistConfig);
    });

    genFromImgBtn.addEventListener("click", () => {
      genFromImgBeforeContainer.classList.add("hidden");
      genFromImgAfterContainer.classList.remove("hidden");
    });

    cancelFinalBtn.addEventListener("click", () => {
      genFile.value = "";

      filePreviews.innerHTML = "";
      filePreviews.classList.add("hidden");

      questionPreviewsInner.innerHTML = "";
      questionPreviews.classList.add("hidden");

      createNewQuestions.checked = false;

      genFromImgBeforeContainer.classList.remove("hidden");
      genFromImgAfterContainer.classList.add("hidden");
    });

    genFile.addEventListener("change", () => {
      filePreviews.innerHTML = "";

      if (genFile.files.length >= 1) {
        // TODO: consider making image expandable (by clicking it)
        // TODO: consider allowing drag-and-drop files
        for (const image of genFile.files) {
          const imageElem = document.createElement("img");
          imageElem.classList.add("filePreview");
          imageElem.height = 100;
          imageElem.src = URL.createObjectURL(image);
          imageElem.alt = image.name;
          imageElem.title = image.name;
          filePreviews.append(imageElem);
        }

        filePreviews.classList.remove("hidden");
      } else filePreviews.classList.add("hidden");
    });

    // TODO: ensure that these variables get reset when closing
    let mouseDown = false;
    let mouseDownX;
    let mouseDownY;
    let moving = false;
    let moveRow;

    // let mouseMoveX;
    let mouseMoveY = null;

    function getScrollPadding() {
      const scrollPadding = Math.min(80, 0.2 * window.innerHeight);
      return scrollPadding;
    }

    function getScrollBy() {
      const scrollPadding = getScrollPadding();

      const distanceToEdge =
        mouseMoveY < window.innerHeight / 2
          ? mouseMoveY
          : window.innerHeight - mouseMoveY;

      const scrollBy = 8 * (1 - distanceToEdge / scrollPadding);

      return scrollBy;
    }

    let checkingScroll = false;

    function checkScroll() {
      // console.log(mouseMoveY);

      // const rowIsNear = Array.from(
      //   questionPreviewsInner.querySelectorAll("tbody tr")
      // ).some(
      //   (row) => Math.abs(mouseMoveY - row.getBoundingClientRect().top) < 40
      // );
      // ).some((row) => {
      // Math.min(
      //   row.clientHeight,
      //   Math.abs(window.innerHeight - row.clientHeight)
      // )
      // console.log(Math.abs(mouseMoveY - row.clientY));
      // const rect = row.getBoundingClientRect();
      // return Math.abs(mouseMoveY - rect.top) < 80;
      // });

      const scrollPadding = getScrollPadding();
      const scrollBy = getScrollBy();
      // console.log(moving);
      // console.log("check!");
      // if (mouseMoveY === null || !rowIsNear) checkingScroll = false;
      if (mouseMoveY === null) checkingScroll = false;
      else if (moving && mouseMoveY < scrollPadding)
        window.scrollTo(0, window.scrollY - scrollBy);
      else if (moving && window.innerHeight - mouseMoveY < scrollPadding)
        window.scrollTo(0, window.scrollY + scrollBy);
      else checkingScroll = false;

      if (checkingScroll) {
        checkMoveQuestion();
        requestAnimationFrame(checkScroll);
      }
    }

    window.addEventListener("scroll", checkMoveQuestion);

    // let moveTable;

    // scrollDetectTop.addEventListener("mouseenter", () => {
    //   console.log("enter");
    // });

    aiAssistOverlay.addEventListener("mousedown", (e) => {
      // const tempMoveTable =
      //   e.target.parentElement?.parentElement?.parentElement;

      if (
        e.target.tagName !== "INPUT" &&
        // tempMoveTable?.classList.contains("questionPreviewsTable")
        e.target.parentElement?.parentElement?.parentElement?.classList.contains(
          "questionPreviewsTable"
        )
      ) {
        e.preventDefault();
        moveRow = e.target.parentElement;
        // moveTable = tempMoveTable;
        mouseDown = true;
        mouseDownX = e.clientX;
        mouseDownY = e.clientY;
        // console.log(e.target);
        // console.log(e.clientX);
        // console.log(e.clientY);
      }
    });

    aiAssistOverlay.addEventListener("mouseup", (e) => {
      if (mouseDown) {
        e.preventDefault();
        mouseDown = false;
        moving = false;
        moveRow.classList.remove("moving");
        // console.log("up");
        // console.log(e.clientX);
        // console.log(e.clientY);
      }
    });

    // aiAssistOverlay.addEventListener("mouseleave", (e) => (mouseMoveY = null));

    aiAssistOverlay.addEventListener("mousemove", (e) => {
      // console.log(e);

      // mouseMoveX = e.clientX;
      mouseMoveY = e.clientY;

      if (
        !moving &&
        mouseDown &&
        Math.sqrt(
          Math.pow(mouseDownX - e.clientX, 2) +
            Math.pow(mouseDownY - e.clientY, 2)
        ) > 3
      ) {
        moving = true;
        moveRow.classList.add("moving");
      }

      if (moving) e.preventDefault();

      checkMoveQuestion();
    });

    function checkMoveQuestion() {
      if (
        // moving &&
        // e.target.parentElement?.parentElement?.parentElement?.classList.contains(
        //   "questionPreviewsTable"
        // ) &&
        // e.target.parentElement?.parentElement?.tagName === "TBODY"
        moving
      ) {
        const scrollPadding = getScrollPadding();
        if (
          !checkingScroll &&
          (mouseMoveY < scrollPadding ||
            window.innerHeight - mouseMoveY < scrollPadding)
        ) {
          checkingScroll = true;
          requestAnimationFrame(checkScroll);
        }

        const nearestRow = Array.from(
          questionPreviewsInner.querySelectorAll("tbody tr")
        ).sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const aPos = aRect.top + aRect.height / 2;
          const aDistance = Math.abs(mouseMoveY - aPos);

          const bRect = b.getBoundingClientRect();
          const bPos = bRect.top + bRect.height / 2;
          const bDistance = Math.abs(mouseMoveY - bPos);

          return aDistance - bDistance;
        })[0];
        // .filter(
        //   (row) =>
        //     // Math.min(
        //     //   row.clientHeight,
        //     //   Math.abs(window.innerHeight - row.clientHeight)
        //     // )
        //     Math.abs(mouseMoveY - row.clientY) < 60
        // )[0];

        // console.log(nearestRow);

        // const hovering = e.target.parentElement;
        if (nearestRow && nearestRow !== moveRow) {
          const position = moveRow.compareDocumentPosition(nearestRow);
          if (position === Node.DOCUMENT_POSITION_FOLLOWING)
            nearestRow.parentElement.insertBefore(
              moveRow,
              nearestRow.nextSibling
            );
          else nearestRow.parentElement.insertBefore(moveRow, nearestRow);
          // console.log(position);
          // hovering.parentElement.insertBefore(moveRow, hovering);
          // console.log("move!!");
        }
        // console.log("move");
        // console.log(e.clientX);
        // console.log(e.clientY);
      }
    }

    genFinalBtn.addEventListener("click", () => {
      setGenFromImgLoading(true);

      const fileCount = genFile.files.length;
      const imageDataUrls = [];

      if (genFile.files.length === 0) {
        setGenFromImgLoading(false);
        alert(
          "An image of curriculum materials must be uploaded in order to generate questions."
        );
        return;
      }

      for (const file of genFile.files) {
        const reader = new FileReader();
        reader.addEventListener(
          "load",
          (e) => {
            const dataUrl = e.target.result;
            imageDataUrls.push(dataUrl);
            if (imageDataUrls.length === fileCount) sendDataUrls();
          },
          { once: true }
        );
        reader.readAsDataURL(file);
      }

      // FIXME: make "create new questions" checkbox functional
      // TODO: ^ in regards to this, consider removing the checkbox altogether
      // TODO: add disclaimer/note to double check the content that AI Question Assist produces

      function sendDataUrls() {
        if (!openAiApiKeyInput.value) {
          alert("An API key must be provided in order to generate questions.");
          setGenFromImgLoading(false);
          return;
        }
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKeyInput.value}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are an AI studying assistant. Your task is to analyze images of curriculum materials and use this as the basis for generating relevant questions and answers. These questions and answers should be suitable for studying purposes. When creating these questions and answers, focus on providing concise, flashcard-style content. For questions, use brief phrases or single words when possible, rather than full sentences. The answers should be equally succinct. Your goal is to create a set of study materials that are easy to review and memorize, conveying the key points from the curriculum materials presented in the images.

${
  createNewQuestions.checked
    ? `You should aim to invent new questions based upon the material provided. Utilizing your own teaching skills, you should create questions that build upon the material being studied.`
    : `Only pull questions directly from the material provided. Refrain from utilizing your own knowledgebase to generate questions. Assume that the material provided is factual and the only reference.`
}

Respond with a JSON object containing an array of question and answer pairs. Each pair should be an object with a \`question\` and \`answer\` key. Your response should be directly parsable, and should not be within a code block. The format should be as follows:

{
  "questions": [
    { "question": "foo", "answer": "bar" },
    { "question": "baz", "answer": "qux" }
  ]
}`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Generate the questions and answers. ${customInstructions.value}`,
                  },
                  ...imageDataUrls.map((dataUrl) => ({
                    type: "image_url",
                    image_url: { url: dataUrl },
                  })),
                ],
              },
            ],
          }),
        })
          .then((res) => res.json())
          .then((res) => {
            try {
              const response = res.choices[0].message.content;
              console.log(response);
              const parsedResponse = JSON.parse(response);
              console.log(parsedResponse);

              questionPreviews.classList.remove("hidden");

              questionPreviewsInner.innerHTML = `
                <table class="questionPreviewsTable">
                  <thead>
                    <tr>
                      <th></th>
                      <th><div class="thInner">Question</div></th>
                      <th><div class="thInner">Answer</div></th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
                <button class="importBtn styledButton">Import <span class="questionImportCount"></span> Questions</button>
                <div class="additionalContext">Importing these questions will add them to your existing list of questions. Your existing questions will not be erased.</div>
              `;

              const tableBody =
                questionPreviewsInner.querySelector("table tbody");
              const importBtn =
                questionPreviewsInner.querySelector(".importBtn");
              const questionImportCount = importBtn.querySelector(
                ".questionImportCount"
              );

              importBtn.addEventListener("click", async () => {
                for (const toDisable of questionPreviewsInner.querySelectorAll(
                  "input, button"
                ))
                  toDisable.disabled = true;

                genFinalBtn.disabled = true;
                cancelFinalBtn.disabled = true;

                // TODO: consider distinguishing AI-generated questions from manually created questions (on main dashboard)
                // TODO: check import overlaps and automatically disable

                // const newQuestions = [{ question: "foo", answer: "bar" }];
                const newQuestions = Array.from(
                  questionPreviewsInner.querySelectorAll("tbody tr")
                )
                  .filter((row) => row.dataset.checked)
                  .map((row) => ({
                    question: row.querySelector("td:nth-of-type(2)").innerText,
                    answer: row.querySelector("td:nth-of-type(3)").innerText,
                  }));

                const oldQuestions =
                  (await electronStore.get("questions")) ?? [];
                questions = [...oldQuestions, ...newQuestions];
                await electronStore.set("questions", questions);
                resetDisplayedConfig();

                questionPreviews.style.height = `${questionPreviews.offsetHeight}px`;
                questionPreviews.offsetHeight;
                // questionPreviews.addEventListener("transitionstart", () =>
                //   questionPreviews.style.removeProperty("height")
                // );
                questionPreviews.classList.add("importSuccess");
                questionPreviews.addEventListener(
                  "transitionend",
                  () => {
                    questionPreviews.style.removeProperty("height");
                    setTimeout(() => {
                      questionPreviews.addEventListener(
                        "transitionend",
                        handleTransitionEnd
                      );

                      questionPreviews.classList.add("removing");

                      function handleTransitionEnd(e) {
                        if (e.propertyName === "opacity") return;
                        questionPreviews.classList.add("hidden");
                        questionPreviews.classList.remove("importSuccess");
                        questionPreviews.classList.remove("removing");
                        questionPreviewsInner.innerHTML = "";
                        questionPreviews.removeEventListener(
                          "transitionend",
                          handleTransitionEnd
                        );

                        genFinalBtn.disabled = false;
                        cancelFinalBtn.disabled = false;
                      }
                    }, 1500);
                  },
                  { once: true }
                );
              });

              function handleCheckInput(elem) {
                const checkbox = elem.querySelector(".includeCheckbox");
                if (checkbox.checked) elem.dataset.checked = true;
                else delete elem.dataset.checked;

                setQuestionImportCount();
              }

              function setQuestionImportCount() {
                const importCount = tableBody.querySelectorAll(
                  ".includeCheckbox:checked"
                ).length;

                if (importCount === 0) importBtn.disabled = true;
                else importBtn.disabled = false;

                questionImportCount.innerText = importCount.toLocaleString();
              }

              for (const question of parsedResponse.questions) {
                // TODO: add message about already-imported questions
                const isChecked = !questions.some(
                  (q) => q.question === question.question
                );

                const newRow = document.createElement("tr");
                newRow.dataset.checked = isChecked;

                const includeElemTd = document.createElement("td");
                const includeElem = document.createElement("input");
                includeElem.classList.add("includeCheckbox");
                includeElem.type = "checkbox";
                includeElem.checked = isChecked;
                // setQuestionImportCount();
                // includeElem.addEventListener("input", setQuestionImportCount);
                includeElem.addEventListener("input", () =>
                  handleCheckInput(newRow)
                );
                includeElemTd.appendChild(includeElem);

                const questionElem = document.createElement("td");
                questionElem.innerText = question.question;

                const answerElem = document.createElement("td");
                answerElem.innerText = question.answer;

                newRow.append(includeElemTd, questionElem, answerElem);

                tableBody.appendChild(newRow);

                newRow.addEventListener("click", (e) => {
                  if (moving) return;
                  if (e.target.tagName !== "INPUT") {
                    includeElem.checked = !includeElem.checked;
                    console.log("changed");
                    // setQuestionImportCount();
                    handleCheckInput(newRow);
                  }
                });
              }

              setQuestionImportCount();
            } catch {
              console.error("Error parsing response");
              console.log(JSON.stringify(res));
              alert(
                `An error occurred while generating questions.${
                  res.error.message.includes("Incorrect API key")
                    ? ` Please ensure that the correct API key was provided and try again.`
                    : ``
                }`
              );
            }

            setGenFromImgLoading(false);
          });
      }
    });

    function setGenFromImgLoading(isLoading) {
      if (isLoading) {
        genFromImgAfterContainer.classList.add("loading");

        for (const toDisable of genFromImgAfterContainer.querySelectorAll(
          "input, textarea, button"
        )) {
          toDisable.disabled = true;
          toDisable.dataset.disabledWhileLoading = true;
        }
      } else {
        genFromImgAfterContainer.classList.remove("loading");

        for (const toDisable of genFromImgAfterContainer.querySelectorAll(
          "[data-disabled-while-loading]"
        )) {
          toDisable.disabled = false;
          delete toDisable.dataset.disabledWhileLoading;
        }
      }
    }

    document.body.insertBefore(aiAssistOverlay, mainDashboardContainer);
  });
})();

function objectsDeepEqual(object1, object2) {
  if (object1 === object2) return true;
  if (
    typeof object1 !== "object" ||
    object1 === null ||
    typeof object2 !== "object" ||
    object2 === null ||
    Object.keys(object1).length !== Object.keys(object2).length
  )
    return false;

  for (const key in object1) {
    const value1 = object1[key];
    const value2 = object2[key];

    if (objectsDeepEqual(value1, value2)) continue;
    else return false;
  }

  return true;
}
