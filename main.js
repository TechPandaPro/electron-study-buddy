const { app, BrowserWindow, Tray } = require("electron");
const path = require("node:path");

if (process.platform !== "darwin") throw new Error("Platform not supported");

let tray;
let configWin;
let quizWin;

const createWindows = () => {
  configWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "windows", "config", "preload.js"),
    },
  });
  configWin.on("close", (e) => {
    // TODO: figure out window closing (see below in other listener)
    e.preventDefault();
    configWin.hide();
  });
  configWin.loadFile("windows/config/index.html");

  // TODO: window needs to be repositioned whenever it's opened (.setPosition)
  // TODO: don't hardcode width
  // const { width: windowWidth } = 800;
  // const { width: windowWidth } = quizWin.getBounds();
  // TODO: tray icon needs to be added first
  // const {
  //   x: trayX,
  //   y: trayY,
  //   width: trayWidth,
  //   height: trayHeight,
  // } = tray.getBounds();

  // const windowX = Math.round(trayX + trayWidth / 2 - windowWidth / 2);
  // const windowY = Math.round(trayY + trayHeight + 10);

  quizWin = new BrowserWindow({
    // x: windowX,
    // y: windowY,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "windows", "quiz", "preload.js"),
    },
  });
  quizWin.setAlwaysOnTop(true, "floating");
  quizWin.on("close", (e) => {
    // TODO: figure out how window closing should work for quiz - maybe prevent closing but allow quitting? (use before-quit https://www.electronjs.org/docs/latest/api/app)
    e.preventDefault();
  });
  quizWin.loadFile("windows/quiz/index.html");

  tray = new Tray(path.join(__dirname, "icon.png"));
  tray.on("click", () => {
    console.log("Tray clicked");
  });
};

app.on("window-all-closed", () => {
  console.log("All windows closed");
});

app.whenReady().then(() => {
  createWindows();

  app.on("activate", () => {
    if (configWin && !configWin.isVisible()) configWin.show();
    // if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});
