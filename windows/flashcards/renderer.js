(async () => {
  const electronAPI = window.electronAPI;
  const electronStore = electronAPI.electronStore;

  const previousFlashcardWrapper = document.getElementById(
    "previousFlashcardWrapper"
  );
  const nextFlashcardWrapper = document.getElementById("nextFlashcardWrapper");

  const flashcardWrapper = document.getElementById("flashcardWrapper");
  const flashcard = document.getElementById("flashcard");
  const flashcardText = document.querySelector(
    "#flashcardInner .flashcardText"
  );
  const flashcardNum = document.querySelector("#flashcardInner .flashcardNum");
  // const flashcardTextBack = document.querySelector(
  //   "#flashcardBack .flashcardText"
  // );

  const previousFlashcard = document.getElementById("previousFlashcard");
  const nextFlashcard = document.getElementById("nextFlashcard");

  const questions = (await electronStore.get(`questions`)) ?? [];

  let questionIndex = 0;

  previousFlashcard.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      flashcard.dataset.rotating ||
      document.querySelector(".newFlashcard.insert")
    )
      return;

    questionIndex--;
    if (questionIndex < 0) questionIndex = questions.length - 1;

    flashcard.classList.add("noAnim");
    flashcard.classList.add("replacingUnderneath");
    flashcard.offsetHeight;
    flashcard.classList.remove("noAnim");

    const newFlashcard = document.createElement("div");
    newFlashcard.classList.add("newFlashcard");
    newFlashcard.classList.add("underneath");

    const newFlashcardText = document.createElement("div");
    newFlashcardText.classList.add("newFlashcardText");
    // newFlashcardText.innerText = questions[questionIndex].question;
    newFlashcardText.innerText = flashcardText.innerText;

    const newFlashcardNum = document.createElement("div");
    newFlashcardNum.classList.add("flashcardNum");
    newFlashcardNum.innerText = flashcardNum.innerText;

    flashcardText.innerText = questions[questionIndex].question;
    setFlashcardNum(flashcard, questionIndex, "question");

    flashcard.dataset.side = "front";

    newFlashcard.addEventListener("animationend", () => {
      // flashcard.classList.add("noAnim");
      newFlashcard.remove();

      if (!document.querySelector(".newFlashcard.underneath"))
        flashcard.classList.remove("replacingUnderneath");
      // flashcard.offsetHeight;
      // flashcard.classList.remove("noAnim");

      // flashcardText.innerText = newFlashcardText.innerText;
    });

    newFlashcard.append(newFlashcardText, newFlashcardNum);
    document.body.insertBefore(
      newFlashcard,
      flashcardWrapper.nextElementSibling
    );
  });

  nextFlashcard.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      flashcard.dataset.rotating ||
      document.querySelector(".newFlashcard.underneath")
    )
      return;

    questionIndex++;
    if (questionIndex === questions.length) questionIndex = 0;

    flashcard.classList.add("replacingTop");

    const newFlashcard = document.createElement("div");
    newFlashcard.classList.add("newFlashcard");
    newFlashcard.classList.add("insert");

    const newFlashcardText = document.createElement("div");
    newFlashcardText.classList.add("newFlashcardText");
    newFlashcardText.innerText = questions[questionIndex].question;

    const newFlashcardNum = document.createElement("div");
    newFlashcardNum.classList.add("flashcardNum");

    flashcard.dataset.side = "front";

    newFlashcard.addEventListener("animationend", () => {
      flashcard.classList.add("noAnim");
      flashcard.classList.remove("replacingTop");
      flashcard.offsetHeight;
      flashcard.classList.remove("noAnim");

      flashcardText.innerText = newFlashcardText.innerText;
      flashcardNum.innerText = newFlashcardNum.innerText;
      newFlashcard.remove();
    });

    newFlashcard.append(newFlashcardText, newFlashcardNum);
    setFlashcardNum(newFlashcard, questionIndex, "question");

    document.body.append(newFlashcard);
  });

  previousFlashcardWrapper.addEventListener("click", () => flashcard.click());
  nextFlashcardWrapper.addEventListener("click", () => flashcard.click());
  previousFlashcardWrapper.addEventListener("mouseenter", () =>
    previousFlashcardWrapper.classList.remove("hidden")
  );
  previousFlashcardWrapper.addEventListener("mouseleave", () =>
    previousFlashcardWrapper.classList.add("hidden")
  );
  nextFlashcardWrapper.addEventListener("mouseenter", () =>
    nextFlashcardWrapper.classList.remove("hidden")
  );
  nextFlashcardWrapper.addEventListener("mouseleave", () =>
    nextFlashcardWrapper.classList.add("hidden")
  );

  flashcardText.innerText = questions[questionIndex].question;
  // flashcardNum.innerText = `${(questionIndex + 1)
  //   .toString()
  //   .padStart(questions.length.toString().length, "0")}/${questions.length}`;
  setFlashcardNum(flashcard, questionIndex, "question");
  // flashcardTextBack.innerText = questions[questionIndex].answer;

  function setFlashcardNum(flashcard, index, type) {
    let flashcardNum = flashcard.querySelector(".flashcardNum");
    if (!flashcardNum) {
      const flashcardInner = flashcard.querySelector(".flashcardInner");
      flashcardNum = document.createElement("div");
      flashcardNum.classList.add("flashcardNum");
      flashcardInner.appendChild(flashcardNum);
    }

    const typeLetter = type === "question" ? "Q" : "A";
    const formattedNum = (index + 1)
      .toString()
      .padStart(questions.length.toString().length, "0");

    const formattedStr = `${formattedNum}/${questions.length} (${typeLetter})`;

    flashcardNum.innerText = formattedStr;

    // flashcardNum.innerText = `${type === "question" ? "Q" : "A"} ${(index + 1)
    //   .toString()
    //   .padStart(questions.length.toString().length, "0")}/${
    //   questions.length
    // }`;
  }

  flashcard.addEventListener("click", () => {
    e.preventDefault();
    if (flashcard.dataset.rotating || document.querySelector(".newFlashcard"))
      return;
    flashcard.dataset.rotating = true;
    // if (flashcard.style.transform) flashcard.style.removeProperty("transform");
    // else flashcard.style.transform = "rotateY(-180deg)";
    flashcard.addEventListener(
      "transitionend",
      () => {
        flashcard.classList.remove("resizeForRotate");
        flashcard.classList.remove("textFlipped");

        flashcard.classList.add("noAnim");
        flashcard.style.removeProperty("transform");
        flashcard.offsetHeight;
        flashcard.classList.remove("noAnim");

        delete flashcard.dataset.rotating;
      },
      { once: true }
    );
    flashcard.style.transform = "rotateY(-180deg)";
    flashcard.classList.add("resizeForRotate");
    const durationStr = getComputedStyle(flashcard).getPropertyValue(
      "transition-duration"
    );
    const durationHalfway = (Number(durationStr.slice(0, -1)) / 2) * 1000;
    setTimeout(() => {
      flashcard.dataset.side =
        flashcard.dataset.side === "front" ? "back" : "front";
      flashcardText.innerText =
        flashcard.dataset.side === "front"
          ? questions[questionIndex].question
          : questions[questionIndex].answer;
      setFlashcardNum(
        flashcard,
        questionIndex,
        flashcard.dataset.side === "front" ? "question" : "answer"
      );
      flashcard.classList.add("textFlipped");
    }, durationHalfway);
    // flashcard.addEventListener(
    //   "animationend",
    //   () => {
    //     flashcardTextFront.innerText = questions[questionIndex].answer;
    //   },
    //   { once: true }
    // );
    // flashcard.classList.add("spinning");
  });

  // document.body.addEventListener("keydown", (e) => {
  //   if (e.key === "a") {
  //     if (document.body.style.backgroundColor) {
  //       document.body.style.removeProperty("background-color");
  //       document.body.style.transform = "translateZ(0deg)";
  //     } else {
  //       document.body.style.backgroundColor = "blue";
  //       document.body.style.transform = "translateZ(10deg)";
  //     }
  //   }
  // });

  // flashcard.addEventListener("transitionend", () => {
  // const textFront = flashcardTextFront.innerText;
  // const textBack = flashcardTextBack.innerText;
  //
  // flashcardTextFront.innerText = textBack;
  // flashcardTextBack.innerText = textFront;
  //
  // flashcard.style.transition = "none";
  // flashcard.style.removeProperty("transform");
  // flashcard.offsetWidth;
  // flashcard.style.removeProperty("transition");
  // });
})();
