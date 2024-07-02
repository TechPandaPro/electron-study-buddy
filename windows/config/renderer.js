const electronStore = window.electronAPI.electronStore;

const questions = document.getElementById("questions");
const saveBtn = document.getElementById("saveBtn");

addRow();

function addRow() {
  const newRow = document.createElement("tr");
  newRow.classList.add("questionInputs");
  newRow.innerHTML = `
    <td><input class="questionInput" placeholder="bonjour" /></td>
    <td><input class="answerInput" placeholder="hello" /></td>
  `;

  const questionInput = newRow.querySelector(".questionInput");
  const answerInput = newRow.querySelector(".answerInput");

  questionInput.addEventListener("input", checkValues);
  answerInput.addEventListener("input", checkValues);

  questions.appendChild(newRow);

  function checkValues() {
    const allInputs = Array.from(
      questions.querySelectorAll("tr.questionInputs")
    );
    const index = allInputs.indexOf(newRow);
    if (
      index === allInputs.length - 1 &&
      (questionInput.value || answerInput.value)
    )
      addRow();
    // if (!questionInput.value && !answerInput.value) newRow.remove();
  }
}

saveBtn.addEventListener("click", () => {
  electronStore.set("");
});
