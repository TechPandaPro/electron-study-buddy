(async () => {
  const electronStore = window.electronAPI.electronStore;

  const questions = (await electronStore.get(`questions`)) ?? [];

  const questionElem = document.getElementById("question");
  const answerElem = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");
  const unsureBtn = document.getElementById("unsureBtn");

  let question;
  newQuestion();

  // TODO: when clicking either button, check if the input is focused, and if so, focus it again afterwards

  answerElem.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitBtn.click();
  });

  submitBtn.addEventListener("click", () => {
    answerElem.focus();

    // TODO: handle correct/incorrect answers
    const providedAnswer = answerElem.value;
    if (providedAnswer === question.answer) {
      // TODO: consider animation for removing this. maybe this could be a more general animation, e.g. fading the entire question page
      const hint = document.querySelector(".hint");
      if (hint) hint.remove();

      answerElem.value = "";
      newQuestion();

      // alert("correct");
    } else {
      const hint = document.querySelector(".hint");
      if (hint) {
        createAlert(`Not quite! Check the hint for the answer!`);
        hint.classList.add("emphasized");
        hint.addEventListener(
          "animationend",
          () => hint.classList.remove("emphasized"),
          true
        );
      } else {
        createAlert(
          `Not quite! If you remember the answer, feel free to try again. Otherwise, click "I'm Unsure" to learn the answer.`
        );
      }

      // TODO: make this configurable (whether or not it empties after incorrect)
      answerElem.value = "";
    }
  });

  unsureBtn.addEventListener("click", () => {
    answerElem.focus();

    // TODO: handle unsure button
    // alert("coming soon");

    unsureBtn.disabled = true;

    const hintWrapperElem = document.createElement("div");
    hintWrapperElem.classList.add("hintWrapper");
    hintWrapperElem.innerHTML = `
      <div class="hint">
        <div class="hintTextWrapper">
          <div class="hintText">
            Pssst... the answer is <span class="hintTextAnswer">${question.answer}</span>
          </div>
        </div>
        <div class="backgroundBubble">
          <svg width="344" height="171" viewBox="0 0 344 171" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="path-1-inside-1_22_46" fill="white">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M25 0C11.1929 0 0 11.1929 0 25V146C0 159.807 11.1929 171 25 171H249H279H344L304 101.947V25C304 11.1929 292.807 0 279 0H25Z"/>
            </mask>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M25 0C11.1929 0 0 11.1929 0 25V146C0 159.807 11.1929 171 25 171H249H279H344L304 101.947V25C304 11.1929 292.807 0 279 0H25Z" fill="white"/>
            <path d="M344 171V178H356.145L350.057 167.491L344 171ZM304 101.947H297V103.828L297.943 105.456L304 101.947ZM7 25C7 15.0589 15.0589 7 25 7V-7C7.32689 -7 -7 7.32688 -7 25H7ZM7 146V25H-7V146H7ZM25 164C15.0589 164 7 155.941 7 146H-7C-7 163.673 7.32688 178 25 178V164ZM249 164H25V178H249V164ZM279 164H249V178H279V164ZM344 164H279V178H344V164ZM297.943 105.456L337.943 174.509L350.057 167.491L310.057 98.4387L297.943 105.456ZM297 25V101.947H311V25H297ZM279 7C288.941 7 297 15.0589 297 25H311C311 7.32689 296.673 -7 279 -7V7ZM25 7H279V-7H25V7Z" fill="black" mask="url(#path-1-inside-1_22_46)"/>
          </svg>
        </div>
      </div>
    `;
    document.body.append(hintWrapperElem);
  });

  answerElem.focus();

  console.log(question);

  function createAlert(text) {
    let alertsContainer = document.querySelector(".alertsContainer");
    if (!alertsContainer) {
      alertsContainer = document.createElement("div");
      alertsContainer.classList.add("alertsContainer");
      document.body.append(alertsContainer);
    }

    const alertWrapperElem = document.createElement("div");
    alertWrapperElem.classList.add("alertWrapper");
    alertWrapperElem.classList.add("animIn");
    alertWrapperElem.addEventListener("transitionend", () => {
      alertWrapperElem.classList.remove("animIn");
      alertWrapperElem.style.removeProperty("height");
    });

    const alertElem = document.createElement("div");
    alertElem.classList.add("alert");

    const alertTextElem = document.createElement("div");
    alertTextElem.classList.add("alertText");
    alertTextElem.innerText = text;

    const alertTimeElem = document.createElement("div");
    alertTimeElem.classList.add("alertTime");
    alertTimeElem.addEventListener(
      "animationend",
      () => {
        alertWrapperElem.addEventListener("transitionend", () =>
          alertWrapperElem.remove()
        );
        alertWrapperElem.classList.add("animOut");
      },
      { once: true }
    );

    alertElem.append(alertTextElem, alertTimeElem);

    alertsContainer.appendChild(alertWrapperElem);

    alertWrapperElem.appendChild(alertElem);
    alertWrapperElem.style.height = `${alertElem.offsetHeight}px`;
  }

  // TODO: prevent duplicates in one session
  function newQuestion() {
    question = questions[getRandomInt(0, questions.length)];
    questionElem.innerText = question.question;
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  // min is inclusive and max is exclusive
  function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }
})();
