const {
  app,
  BrowserWindow,
  Tray,
  dialog,
  ipcMain,
  nativeTheme,
} = require("electron");
const Store = require("electron-store");
const path = require("node:path");

if (process.platform !== "darwin") throw new Error("Platform not supported");

let tray;
let configWin;
let quizWin;

// whether the application is currently being quit
let quitting = false;

// // if noCloseConfig = true, configWin will not be closed
// let noCloseConfig = false;

// // if quizCanClose = true, confirmation box will not be shown when closing quizWin
// let quizCanClose = false;

// whether the config (dashboard) is unsaved
let configNeedsSave = false;

// TODO: set app icon ? (this might not be done until the application packaging stage)

// TODO: consider adding option to reposition default quizWin position

const createWindows = () => {
  configWin = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? "rgb(10, 10, 10)"
      : "rgb(255, 255, 255)",
    webPreferences: {
      preload: path.join(__dirname, "windows", "config", "preload.js"),
    },
  });
  // TODO: remove dev tools - this is here just for dev testing
  configWin.openDevTools({ mode: "detach" });
  configWin.on("close", (e) => {
    // TODO: figure out window closing (see below in other listener)

    // if (noCloseConfig) {
    //   noCloseConfig = false;
    //   e.preventDefault();
    //   return;
    // }

    // let interceptClose = !quitting && !configNeedsSave;

    let hideForClose = !configNeedsSave;

    if (configNeedsSave) {
      const response = dialog.showMessageBoxSync(configWin, {
        type: "question",
        buttons: ["Yes", "No"],
        title: "Confirm Exit",
        message:
          "You have unsaved changes! Are you sure you want to close your dashboard without saving?",
      });
      // if (!quitting && response === 0) interceptClose = true;
      if (response === 0) hideForClose = true;
      else if (response === 1) e.preventDefault();
    }

    if (hideForClose) {
      if (!quitting || (quizWin && !quizWin.isDestroyed())) {
        e.preventDefault();
        configWin.webContents.send("reset-unsaved");
        configWin.hide();
      }
      if (quitting && quizWin && !quizWin.isDestroyed()) quizWin.close();

      // if (quitting) {
      //   if (quizWin && !quizWin.isDestroyed()) quizWin.close();
      //   else app.quit();
      // }
    }

    // if (interceptClose) {
    //   e.preventDefault();
    //   configWin.webContents.send("reset-unsaved");
    //   configWin.hide();
    // }

    // TODO: add alert when closing if unsaved (look into various methods for this)
  });
  // configWin.on("hide", () => {
  //   if (quitting && quizWin && !quizWin.isDestroyed()) quizWin.close();
  // });
  configWin.on("closed", () => {
    if (!quizWin || quizWin.isDestroyed()) app.quit();
  });
  configWin.loadFile("windows/config/index.html");

  // icon from https://flowbite.com/
  tray = new Tray(path.join(__dirname, "icon.png"));
  tray.on("click", () => {
    console.log("Tray clicked");
    setQuizPosition();
  });
};

app.on("before-quit", (e) => {
  if (
    (configWin && !configWin.isDestroyed() && configWin.isVisible()) ||
    (quizWin && !quizWin.isDestroyed())
  ) {
    e.preventDefault();

    quitting = true;

    // if configWin is closed successfully, then it will handle closing quizWin
    if (configWin && !configWin.isDestroyed()) configWin.close();
  }

  // if (quizWin && !quizWin.isDestroyed()) quizWin.close();
  // if (quizWin && !quizWin.isDestroyed()) return;
  // if (configWin && !configWin.isDestroyed()) configWin.close();

  // quitting = true;
});

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
  ipcMain.handle(
    "set-needs-save",
    (_event, needsSave) => (configNeedsSave = needsSave)
  );

  createWindows();

  app.on("activate", () => {
    // console.log("activated");
    // if (!configWin || configWin.isDestroyed()) openConfig();
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
  if (quizWin && !quizWin.isDestroyed()) return quizWin.focus();

  quizWin = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: "rgb(2, 62, 138)",
    // frame: false,
    resizable: false,
    // movable: false,
    webPreferences: {
      preload: path.join(__dirname, "windows", "quiz", "preload.js"),
    },
    // TODO: remove show: false - this is here just so it's out of the way for now
    // show: false,
  });
  quizWin.setAlwaysOnTop(true, "floating");
  quizWin.on("close", (e) => {
    // TODO: figure out how window closing should work for quiz - maybe prevent closing but allow quitting? (use before-quit https://www.electronjs.org/docs/latest/api/app)
    // FIXME: ^ currently, when closing quizWin, it does not re-open
    // if (quizCanClose) {
    //   quizCanClose = false;
    //   return;
    // }
    const response = dialog.showMessageBoxSync(quizWin, {
      type: "question",
      buttons: ["Yes", "No"],
      title: "Confirm Exit",
      message:
        "Are you sure you want to exit this quiz session? You can always begin a new session later in your Study Buddy Dashboard.",
    });
    // if (response === 0) {
    //   e.preventDefault();
    //   quizCanClose = true;
    //   quizWin.close();
    // }
    // if (response === 1) {
    //   e.preventDefault();
    //   noCloseConfig = true;
    // }
    // if (response === 0) {
    //   if (quitting) app.quit();
    // } else if (response === 1) e.preventDefault();
    if (response === 1) e.preventDefault();
  });
  quizWin.on("closed", () => {
    if (quitting) app.quit();
  });
  quizWin.loadFile("windows/quiz/index.html");

  setQuizPosition();

  // quizWin.show();
}
