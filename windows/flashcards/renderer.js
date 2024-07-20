(async () => {
  const electronAPI = window.electronAPI;
  const electronStore = electronAPI.electronStore;

  const flashcard = document.getElementById("flashcard");
  const flashcardFront = document.getElementById("flashcardFront");
  const flashcardBack = document.getElementById("flashcardBack");

  const questions = (await electronStore.get(`questions`)) ?? [];

  let questionIndex = 0;

  flashcardFront.innerText = questions[questionIndex].question;

  flashcard.addEventListener("click", () => {
    flashcard.style.transform = "rotateY(180deg)";
  });
})();
