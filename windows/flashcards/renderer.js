(async () => {
  const electronAPI = window.electronAPI;
  const electronStore = electronAPI.electronStore;

  const flashcard = document.getElementById("flashcard");
  const flashcardTextFront = document.querySelector(
    "#flashcardInner .flashcardText"
  );
  // const flashcardTextBack = document.querySelector(
  //   "#flashcardBack .flashcardText"
  // );

  const questions = (await electronStore.get(`questions`)) ?? [];

  let questionIndex = 0;

  flashcardTextFront.innerText = questions[questionIndex].question;
  // flashcardTextBack.innerText = questions[questionIndex].answer;

  flashcard.addEventListener("click", () => {
    if (flashcard.dataset.rotating) return;
    flashcard.dataset.rotating = true;
    // if (flashcard.style.transform) flashcard.style.removeProperty("transform");
    // else flashcard.style.transform = "rotateY(-180deg)";
    flashcard.addEventListener(
      "transitionend",
      () => {
        flashcard.classList.remove("resizeForRotate");
        flashcardTextFront.classList.remove("flipped");

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
      flashcardTextFront.innerText =
        flashcard.dataset.side === "front"
          ? questions[questionIndex].question
          : questions[questionIndex].answer;
      flashcardTextFront.classList.add("flipped");
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
