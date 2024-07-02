const { app, BrowserWindow, Tray, ipcMain } = require("electron");
const Store = require("electron-store");
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
  // TODO: remove dev tools - this is here just for dev testing
  configWin.openDevTools({ mode: "detach" });
  configWin.on("close", (e) => {
    // TODO: figure out window closing (see below in other listener)
    e.preventDefault();
    configWin.hide();
  });
  configWin.loadFile("windows/config/index.html");

  quizWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "windows", "quiz", "preload.js"),
    },
    // TODO: remove show: false - this is here just so it's out of the way for now
    show: false,
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
