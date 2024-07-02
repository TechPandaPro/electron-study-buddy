const electronStore = window.electronAPI.electronStore;

const questionsBody = document.querySelector("#questions tbody");
const saveBtn = document.getElementById("saveBtn");

addRow();

function addRow() {
  const newRow = document.createElement("tr");
  newRow.classList.add("questionInputs");
  newRow.innerHTML = `
    <td><input class="questionInput" placeholder="bonjour" /></td>
    <td><input class="answerInput" placeholder="hello" /></td>
    <td><button class="removeBtn" aria-label="Remove"><img src="./close.svg" /></button></td>
  `;

  const questionInput = newRow.querySelector(".questionInput");
  const answerInput = newRow.querySelector(".answerInput");

  // changed my mind on UX - not going to use checkValuesFinished
  // questionInput.addEventListener("change", checkValuesFinished);
  // answerInput.addEventListener("change", checkValuesFinished);

  questionInput.addEventListener("input", checkValues);
  answerInput.addEventListener("input", checkValues);

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

  // changed my mind on UX - not going to use checkValuesFinished
  // function checkValuesFinished() {
  //   questionInput.value = questionInput.value.trim();
  //   answerInput.value = answerInput.value.trim();

  //   const allInputs = Array.from(
  //     questions.querySelectorAll("tr.questionInputs")
  //   );
  //   const index = allInputs.indexOf(newRow);
  //   console.log(document.activeElement);
  //   if (
  //     index !== allInputs.length - 1 &&
  //     !questionInput.value &&
  //     !answerInput.value &&
  //     ![questionInput, answerInput].includes(document.activeElement)
  //   )
  //     newRow.remove();
  // }
}

saveBtn.addEventListener("click", () => {
  electronStore.set("");
});
