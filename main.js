const { app, BrowserWindow, Tray, dialog, ipcMain } = require("electron");
const Store = require("electron-store");
const path = require("node:path");

if (process.platform !== "darwin") throw new Error("Platform not supported");

let tray;
let configWin;
let quizWin;

// TODO: set app icon ? (this might not be done until the application packaging stage)

const createWindows = () => {
  // TODO: set backgroundColor on both windows (should match whatever is in CSS)
  configWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "windows", "config", "preload.js"),
    },
  });
  // TODO: remove dev tools - this is here just for dev testing
  configWin.openDevTools({ mode: "detach" });
  configWin.on("close", (e) => {
    // TODO: figure out window closing (see below in other listener)
    e.preventDefault();
    configWin.hide();
    // TODO: add alert when closing if unsaved (look into various methods for this)
  });
  configWin.loadFile("windows/config/index.html");

  quizWin = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: false,
    resizable: false,
    // movable: false,
    webPreferences: {
      preload: path.join(__dirname, "windows", "quiz", "preload.js"),
    },
    // TODO: remove show: false - this is here just so it's out of the way for now
    show: false,
  });
  quizWin.setAlwaysOnTop(true, "floating");
  quizWin.on("close", (e) => {
    // TODO: figure out how window closing should work for quiz - maybe prevent closing but allow quitting? (use before-quit https://www.electronjs.org/docs/latest/api/app)
    // FIXME: ^ currently, when closing quizWin, it does not re-open
    const response = dialog.showMessageBoxSync(quizWin, {
      type: "question",
      buttons: ["Yes", "No"],
      title: "Confirm Exit",
      message:
        "Are you sure you want to exit this quiz session? You can always begin a new session later in your Study Buddy Dashboard.",
    });
    if (response === 1) e.preventDefault();
  });
  quizWin.loadFile("windows/quiz/index.html");

  // icon from https://flowbite.com/
  tray = new Tray(path.join(__dirname, "icon.png"));
  tray.on("click", () => {
    console.log("Tray clicked");
    setQuizPosition();
  });
};

app.on("window-all-closed", () => {
  console.log("All windows closed");
});

app.whenReady().then(() => {
  const store = new Store();

  ipcMain.handle("electron-store-set", (_event, key, value) =>
    store.set(key, value)
  );
  ipcMain.handle("electron-store-get", (_event, key) => store.get(key));
  ipcMain.handle("electron-store-delete", (_event, key) => store.delete(key));
  ipcMain.handle("quiz-start", () => startQuiz());

  createWindows();

  app.on("activate", () => {
    if (configWin && !configWin.isVisible()) configWin.show();
    // if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

function setQuizPosition() {
  if (!quizWin || !tray) return;

  const { width: windowWidth } = quizWin.getBounds();
  const {
    x: trayX,
    y: trayY,
    width: trayWidth,
    height: trayHeight,
  } = tray.getBounds();

  const windowX = Math.round(trayX + trayWidth / 2 - windowWidth / 2);
  const windowY = Math.round(trayY + trayHeight + 10);

  quizWin.setPosition(windowX, windowY, false);
}

function startQuiz() {
  setQuizPosition();
  quizWin.show();
}
