const electronStore = window.electronAPI.electronStore;

const questionsBody = document.querySelector("#questions tbody");
const saveBtn = document.getElementById("saveBtn");

addRow();

function addRow() {
  const newRow = document.createElement("tr");
  newRow.classList.add("questionInputs");
  newRow.innerHTML = `
    <td><div class="customInputWrapper"><input class="customInput questionInput" placeholder="bonjour" /></div></td>
    <td><div class="customInputWrapper"><input class="customInput answerInput" placeholder="hello" /></div></td>
    <td><button class="removeBtn" aria-label="Remove"><img src="./close.svg" /></button></td>
  `;

  const questionInput = newRow.querySelector(".questionInput");
  const answerInput = newRow.querySelector(".answerInput");
  const removeBtn = newRow.querySelector(".removeBtn");

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

saveBtn.addEventListener("click", () => {
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

  console.log(questions);

  return questions;

  // electronStore.set("");
});
