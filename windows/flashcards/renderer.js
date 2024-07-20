(async () => {
  const electronAPI = window.electronAPI;
  const electronStore = electronAPI.electronStore;

  const flashcard = document.getElementById("flashcard");
  const flashcardTextFront = document.querySelector(
    "#flashcardFront .flashcardText"
  );
  const flashcardTextBack = document.querySelector(
    "#flashcardBack .flashcardText"
  );

  const questions = (await electronStore.get(`questions`)) ?? [];

  let questionIndex = 0;

  flashcardTextFront.innerText = questions[questionIndex].question;
  flashcardTextBack.innerText = questions[questionIndex].answer;

  flashcard.addEventListener("click", () => {
    // if (flashcard.style.transform) flashcard.style.removeProperty("transform");
    // else flashcard.style.transform = "rotateY(-180deg)";
    flashcard.style.transform = "rotateY(-180deg)";
  });

  document.body.addEventListener("keydown", (e) => {
    if (e.key === "a") {
      if (document.body.style.backgroundColor) {
        document.body.style.removeProperty("background-color");
        document.body.style.transform = "translateZ(0deg)";
      } else {
        document.body.style.backgroundColor = "blue";
        document.body.style.transform = "translateZ(10deg)";
      }
    }
  });

  flashcard.addEventListener("transitionend", () => {
    const textFront = flashcardTextFront.innerText;
    const textBack = flashcardTextBack.innerText;

    flashcardTextFront.innerText = textBack;
    flashcardTextBack.innerText = textFront;

    flashcard.style.transition = "none";
    flashcard.style.removeProperty("transform");
    flashcard.offsetWidth;
    flashcard.style.removeProperty("transition");
  });
})();
