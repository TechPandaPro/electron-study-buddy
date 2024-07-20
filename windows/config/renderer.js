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
      questionCount: Number(popQuizQuestionCount.value),
      showIncorrect: quizShowIncorrect.checked,
    };

    return { popQuizConfig, questions };
  }

  function resetDisplayedConfig() {
    popQuizzesEnabledElem.checked = popQuizConfig.enabled;
    popQuizIntervalCountElem.value = popQuizConfig.intervalCount;
    popQuizIntervalTimeElem.value = popQuizConfig.intervalTime;
    popQuizQuestionCount.value = popQuizConfig.questionCount;
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

  aiQuestionAssistBtn.addEventListener("click", () => {
    const aiAssistOverlay = document.createElement("div");
    aiAssistOverlay.classList.add("aiAssistOverlay");

    //   <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    //   <path d="M11 11L129 129" stroke="currentColor" stroke-width="22" stroke-linecap="round"/>
    //   <path d="M11 129L129 11" stroke="currentColor" stroke-width="22" stroke-linecap="round"/>
    // </svg>

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
                <label for="genFile" class="styledButton">Upload File</label>
                <input type="file" id="genFile" accept=".png, .jpeg, .jpg, .webp" multiple />
              </div>
              <div id="filePreviews" class="hidden"></div>
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
      </div>
    `;

    // <div id="quizShowIncorrectConfigContainer">
    //   <input type="checkbox" id="quizShowIncorrect" />
    //   <label for="quizShowIncorrect"
    //     >Show incorrect quiz answer submissions</label
    //   >
    //   <div class="additionalConfigContext">
    //     This is useful if you want to look at your response again after
    //     discovering that it was incorrect.
    //   </div>
    // </div>

    const exitAssistBtn = aiAssistOverlay.querySelector(".exitAssistBtn");
    exitAssistBtn.addEventListener("click", () => {
      aiAssistOverlay.remove();
    });

    const openAiApiKeyInput = aiAssistOverlay.querySelector("#openAiApiKey");

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
    const createNewQuestions = genFromImgAfterContainer.querySelector(
      "#createNewQuestions"
    );
    const genFinalBtn = genFromImgAfterContainer.querySelector("#genFinalBtn");
    const cancelFinalBtn =
      genFromImgAfterContainer.querySelector("#cancelFinalBtn");

    genFromImgBtn.addEventListener("click", () => {
      // const fileUpload = document.createElement("input");
      // fileUpload.type = "file";
      //
      // const generateBtn = document.createElement("button");
      // generateBtn.classList.add("styledButton");
      // generateBtn.innerText = "Generate";
      //
      // genFromImgContainer.append(fileUpload, generateBtn);

      genFromImgBeforeContainer.classList.add("hidden");
      genFromImgAfterContainer.classList.remove("hidden");
    });

    cancelFinalBtn.addEventListener("click", () => {
      genFile.value = "";
      filePreviews.innerHTML = "";
      filePreviews.classList.add("hidden");
      createNewQuestions.checked = false;

      genFromImgBeforeContainer.classList.remove("hidden");
      genFromImgAfterContainer.classList.add("hidden");
    });

    genFile.addEventListener("change", () => {
      filePreviews.innerHTML = "";
      if (genFile.files.length >= 1) {
        const fileNames = Array.from(genFile.files)
          .map((file) => file.name)
          .join(", ");
        console.log(fileNames);

        // FIXME: resize these images
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

    genFinalBtn.addEventListener("click", () => {
      genFromImgAfterContainer.classList.add("loading");

      // const tempCanvas = document.createElement("canvas");
      // const tempCtx = tempCanvas.getContext("2d");

      // const imageDataUrls = Array.from(
      //   filePreviews.querySelectorAll(".filePreview")
      // ).map((image) => {
      //   tempCanvas.width = image.naturalWidth;
      //   tempCanvas.height = image.naturalHeight;
      //   tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
      //   return tempCanvas.toDataURL();
      // });

      // const imageDataUrls = Array.from(genFile.files).map((file) => {
      //   const reader = new FileReader();
      //   reader.addEventListener(
      //     "load",
      //     (e) => {
      //       console.log(e.target.result);
      //     },
      //     { once: true }
      //   );
      //   reader.readAsDataURL(file);
      // });

      const fileCount = genFile.files.length;
      const imageDataUrls = [];

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

      console.log(imageDataUrls);

      function sendDataUrls() {
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
                content:
                  "You are an AI studying assistant. Your task is to analyze images of curriculum materials and use this as the basis for generating relevant questions and answers. The questions and answers should be pertinent material that can be used for studying. Format the questions and answers in a concise manner that could be used for flashcards. Rather than writing full sentences for questions, use brief phrases or words, where possible.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Generate the questions and answers.",
                  },
                  ...imageDataUrls.map((dataUrl) => ({
                    type: "image_url",
                    image_url: { url: dataUrl },
                  })),
                  // { type: "image_url", image_url: { url: "" } },
                ],
              },
            ],
          }),
        })
          .then((res) => res.json())
          .then((res) => {
            const response = res.choices[0].message.content;
            console.log(response);
          });
      }

      // the OpenAI API can actually just be fetched client-side
      // fetch("/api/createQuestions", {
      //   method: "POST",
      //   body: genFile.files,
      // })
      //   .then((res) => res.json())
      //   .then((res) => console.log(res));
    });

    // document.body.appendChild(aiAssistOverlay);
    document.body.insertBefore(aiAssistOverlay, mainDashboardContainer);
  });

  aiQuestionAssistBtn.click();
})();
