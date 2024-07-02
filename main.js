const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const createWindow = () => {
  const configWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "windows", "config", "preload.js"),
    },
  });
  configWin.loadFile("windows/config/index.html");

  const quizWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "windows", "quiz", "preload.js"),
    },
  });
  quizWin.setAlwaysOnTop(true, "floating");
  quizWin.on("close", (e) => {
    e.preventDefault();
  });
  quizWin.loadFile("windows/quiz/index.html");
};

app.on("window-all-closed", () => {
  console.log("All windows closed");
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
