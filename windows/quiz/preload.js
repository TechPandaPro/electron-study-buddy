// window.addEventListener("DOMContentLoaded", () => {
//   const replaceText = (selector, text) => {
//     const element = document.getElementById(selector);
//     if (element) element.innerText = text;
//   };

//   for (const dependency of ["chrome", "node", "electron"]) {
//     replaceText(`${dependency}-version`, process.versions[dependency]);
//   }
// });

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  electronStore: {
    // set: (key, value) => ipcRenderer.invoke("electron-store-set", key, value),
    get: (key) => ipcRenderer.invoke("electron-store-get", key),
    // delete: (key) => ipcRenderer.invoke("electron-store-delete", key),
  },
  setQuizFinished: (quizFinished) =>
    ipcRenderer.invoke("set-quiz-finished", quizFinished),
});
