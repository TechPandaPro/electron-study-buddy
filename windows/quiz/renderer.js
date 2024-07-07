(async () => {
  const electronAPI = window.electronAPI;
  const electronStore = electronAPI.electronStore;

  const questions = (await electronStore.get(`questions`)) ?? [];

  const questionNumElem = document.getElementById("questionNum");
  const questionElem = document.getElementById("question");
  const answerElem = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");
  const unsureBtn = document.getElementById("unsureBtn");

  // const quizStats = {
  //   totalQuestions: 0,
  //   correctQuestions: 0,
  // };

  let correctQuestions = 0;

  // a used attempt is either a submitted correct/incorrect answer or a hint given
  let attemptsUsed = 0;

  // TODO: make max questions configurable (& whether or not duplicates are allowed)
  const maxQuestions = 5;
  let questionNum = 0;
  let question;
  newQuestion();

  answerElem.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      submitBtn.click();
    }
  });

  submitBtn.addEventListener("click", () => {
    answerElem.focus();

    // TODO: disable submitBtn when answerElem is empty
    // TODO: add stats to end screen
    // TODO: allow closing when quiz is finished

    // quizStats.totalQuestions++;

    const providedAnswer = answerElem.value;
    if (!providedAnswer)
      createAlert(
        `Please provide an answer before submitting! Click "I'm Unsure" if you don't remember the answer.`
      );
    else if (providedAnswer === question.answer) {
      // quizStats.correctQuestions++;
      attemptsUsed++;
      if (attemptsUsed === 1) correctQuestions++;

      // TODO: consider animation for removing this. maybe this could be a more general animation, e.g. fading the entire question page
      const hint = document.querySelector(".hint");
      if (hint) hint.remove();

      // TODO: consider various ways to display "correct" message
      createAlert("Correct!");

      // TODO: consider closing from main process (?)
      if (questionNum === maxQuestions) {
        electronAPI.setQuizFinished(true);

        document.body.innerHTML = `
          <div class="finishedText">You finished this pop quiz!</div>
          <table class="quizResults">
            <tr>
              <th>Total Questions:</th>
              <td>${questionNum}</td>
            </tr>
            <tr>
              <th>Correct Attempts:</th>
              <td>${correctQuestions}</td>
            </tr>
          </table>
          <button class="responseBtn closeQuizBtn">Close</button>
        `;

        // document.body.innerHTML = `
        //   <div class="finishedText">You finished this pop quiz!</div>
        //   <table class="quizResults">
        //     <thead>
        //       <tr>
        //         <th>Total Questions</th>
        //         <th>Correct Questions</th>
        //       </tr>
        //     </thead>
        //     <tbody>
        //       <tr>
        //         <th>${quizStats.totalQuestions}</td>
        //         <th>${quizStats.correctQuestions}</td>
        //       </tr>
        //     </tbody>
        //     </table>
        //   <button class="responseBtn closeQuizBtn">Close</button>
        // `;

        // document.body.innerHTML = `
        //   <div class="finishedText">You finished this pop quiz!</div>
        //   <div class="quizStats">
        //     <div>Total Questions: ${quizStats.totalQuestions}</div>
        //     <div>Correct Questions: ${quizStats.correctQuestions}</div>
        //   </div>
        //   <button class="responseBtn closeQuizBtn">Close</button>
        // `;

        const closeQuizBtn = document.body.querySelector(".closeQuizBtn");

        closeQuizBtn.addEventListener("click", () => {
          // TODO: consider if this should be done from main process (?)
          window.close();
        });

        document.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === "Escape") closeQuizBtn.click();
        });

        addConfetti();

        // FIXME: add button (or preferably a whole new layout) for closing quiz, instead of using a timeout
        // setTimeout(() => {
        // window.close();
        // }, 5000);
      } else {
        answerElem.value = "";
        newQuestion();
      }
    } else {
      attemptsUsed++;
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

    attemptsUsed++;

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
    attemptsUsed = 0;
    unsureBtn.disabled = false;

    questionNum++;
    questionNumElem.innerText = `${questionNum}/${maxQuestions}`;

    question = questions[getRandomInt(0, questions.length)];
    questionElem.innerText = question.question;
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  // min is inclusive, max is exclusive
  function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }

  // min is inclusive, max is inclusive
  function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
  }

  // min is inclusive, max is exclusive
  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  function addConfetti() {
    const confetti = [];
    const addConfettiFor = 500;
    const addConfettiUntil = Date.now() + addConfettiFor;

    const canvas = document.createElement("canvas");
    canvas.classList.add("confettiCanvas");
    canvas.width = document.body.offsetWidth;
    canvas.height = document.body.offsetHeight;
    document.body.append(canvas);

    const ctx = canvas.getContext("2d");

    window.requestAnimationFrame(draw);

    // TODO: clear interval (and remove canvas) after confetti is cleared
    setInterval(update, 16);

    const gravity = 0.15;
    const resistance = 0.98;

    const rotateInterval = 100;

    const confettiSpeedMin = 20;
    const confettiSpeedMax = 25;

    const angleSpaceBottom = 30;

    function update() {
      if (addConfettiUntil > Date.now()) generateConfetti(3);

      for (const confetto of confetti) {
        confetto.yVel += gravity;

        confetto.xVel *= resistance;
        confetto.yVel *= resistance;

        confetto.x += confetto.xVel;
        confetto.y += confetto.yVel;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // fun fact: confetto is the singular of confetti :)
      for (const confetto of confetti) {
        ctx.save();

        ctx.fillStyle = confetto.color;

        const confettoCenterX = confetto.x + confetto.width / 2;
        const confettoCenterY = confetto.y + confetto.height / 2;

        const existedFor = Date.now() - confetto.createdAt;

        const scale = getScaleForTime(existedFor);

        ctx.translate(confettoCenterX, confettoCenterY);
        ctx.rotate(confetto.rotation);
        ctx.scale(scale, 1);
        ctx.translate(-confettoCenterX, -confettoCenterY);

        ctx.fillRect(confetto.x, confetto.y, confetto.width, confetto.height);

        ctx.restore();
      }

      window.requestAnimationFrame(draw);
    }

    function generateConfetti(count = 1) {
      for (let i = 0; i < count; i++) generateConfetto();
    }

    function generateConfetto() {
      const width = 10;
      const height = 20;

      let x;
      let angleDeg;

      if (getRandomIntInclusive(0, 1) === 0) {
        x = 0 - height;
        angleDeg = getRandomArbitrary(-90, -angleSpaceBottom);
      } else {
        x = canvas.width + height;
        angleDeg = getRandomArbitrary(-180 + angleSpaceBottom, -90);
      }

      const y = canvas.height + height;

      const speed = getRandomArbitrary(confettiSpeedMin, confettiSpeedMax);

      const angleRad = angleDeg * (Math.PI / 180);

      const xVel = Math.cos(angleRad) * speed;
      const yVel = Math.sin(angleRad) * speed;

      const hue = `${getRandomInt(0, 360)}deg`;
      const saturation = `${getRandomIntInclusive(70, 100)}%`;
      const lightness = `${getRandomIntInclusive(40, 70)}%`;

      confetti.push({
        x,
        y,
        rotation: getRandomInt(0, 360) * (Math.PI / 180),
        width: width,
        height: height,
        color: `hsl(${hue} ${saturation} ${lightness})`,
        xVel,
        yVel,
        createdAt: Date.now(),
      });
    }

    function getScaleForTime(existedFor) {
      const scaleAbs = (existedFor % rotateInterval) * (1 / rotateInterval);

      const scale =
        Math.floor(existedFor / rotateInterval) % 2 === 0
          ? 1 - scaleAbs
          : scaleAbs;

      return scale;
    }
  }
})();
