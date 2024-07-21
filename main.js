const {
  app,
  BrowserWindow,
  Tray,
  dialog,
  ipcMain,
  nativeTheme,
  powerMonitor,
} = require("electron");
const Store = require("electron-store");
const path = require("node:path");

if (process.platform !== "darwin") throw new Error("Platform not supported");

let tray;
let configWin;
let quizWin;
let flashcardsWin;

// cached value of persistent popQuizConfig
let popQuizConfig;

// an array of all the info on when a quiz should randomly appear (timestamps etc.)
let allAppearAt = [];

// whether the application is currently being quit
let quitting = false;

// FIXME: at some point, quitting needs to be set to false again (if quit is cancelled)

// whether the config (dashboard) is unsaved
let configNeedsSave = false;

// whether the currently open quizWin is finished (if quizFinished = true, this avoids confirmation before close)
let quizFinished = false;

// TODO: set app icon ? (this might not be done until the application packaging stage)

// TODO: consider adding option to reposition default quizWin position

const createWindows = () => {
  configWin = new BrowserWindow({
    width: 800,
    height: 700,
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
    let hideForClose = !configNeedsSave;

    if (configNeedsSave) {
      const response = dialog.showMessageBoxSync(configWin, {
        type: "question",
        buttons: ["Yes", "No"],
        title: "Confirm Exit",
        message:
          "You have unsaved changes! Are you sure you want to close your dashboard without saving?",
      });
      if (response === 0) {
        // quitting = false;
        hideForClose = true;
      } else if (response === 1) e.preventDefault();
    }

    if (hideForClose) {
      if (!quitting || (quizWin && !quizWin.isDestroyed())) {
        e.preventDefault();
        configWin.webContents.send("reset-unsaved");
        configWin.hide();
      }
      if (quitting && quizWin && !quizWin.isDestroyed()) quizWin.close();
    }
  });
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
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
});

app.whenReady().then(async () => {
  const store = new Store();

  ipcMain.handle("electron-store-set", (_event, key, value) => {
    if (key === "popQuizConfig") {
      popQuizConfig = value;
      createRandomAppears();
    }
    store.set(key, value);
  });
  ipcMain.handle("electron-store-get", (_event, key) => store.get(key));
  ipcMain.handle("electron-store-delete", (_event, key) => store.delete(key));
  ipcMain.handle("quiz-start", () => startQuiz());
  ipcMain.handle("flashcards-start", () => startFlashcards());
  ipcMain.handle(
    "set-needs-save",
    (_event, needsSave) => (configNeedsSave = needsSave)
  );
  ipcMain.handle(
    "set-quiz-finished",
    (_event, newQuizFinished) => (quizFinished = newQuizFinished)
  );

  createWindows();

  app.on("activate", () => {
    if (configWin && !configWin.isVisible()) configWin.show();
  });

  popQuizConfig = (await store.get("popQuizConfig")) ?? {
    enabled: false,
    intervalCount: 2,
    intervalTime: 1,
  };

  createRandomAppears();
});

function createRandomAppears() {
  for (const appearAt of allAppearAt) clearTimeout(appearAt.timeout);
  allAppearAt.splice(0, allAppearAt.length);

  if (popQuizConfig.enabled)
    for (let i = 0; i < popQuizConfig.intervalCount; i++) createRandomAppear();
}

function createRandomAppear() {
  const delay = getRandomInt(
    0.1 * 60 * 1000, // 1 minute min
    popQuizConfig.intervalTime * 60 * 60 * 1000 // {intervalTime} hours max
  );

  const appearAtObj = {};
  appearAtObj.stamp = Date.now() + delay;
  appearAtObj.appeared = false;

  appearAtObj.timeout = setTimeout(() => {
    if (Date.now() >= appearAtObj.stamp) {
      allAppearAt.splice(allAppearAt.indexOf(appearAtObj), 1);
      createRandomAppear();

      const delay = Date.now() - appearAtObj.stamp;
      if (delay > 5000) return;

      const idleState = powerMonitor.getSystemIdleState(180);
      if (idleState !== "active") return;

      if (!quizWin || quizWin.isDestroyed()) startQuiz();
    }
  }, delay);

  allAppearAt.push(appearAtObj);
}

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
    // TODO: determine whether quizWin should be movable or not
    // movable: false,
    webPreferences: {
      preload: path.join(__dirname, "windows", "quiz", "preload.js"),
    },
  });
  quizWin.setAlwaysOnTop(true, "floating");
  quizWin.on("close", (e) => {
    if (!quizFinished) {
      const response = dialog.showMessageBoxSync(quizWin, {
        type: "question",
        buttons: ["Yes", "No"],
        title: "Confirm Exit",
        message:
          "Are you sure you want to exit this quiz session? You can always begin a new session later in your Study Buddy Dashboard.",
      });
      if (response === 1) e.preventDefault();
      // else quitting = false;
    }
  });
  quizWin.on("closed", () => {
    quizFinished = false;
    if (quitting) app.quit();
  });
  quizWin.loadFile("windows/quiz/index.html");

  setQuizPosition();
}

function startFlashcards() {
  if (flashcardsWin && !flashcardsWin.isDestroyed())
    return flashcardsWin.focus();

  flashcardsWin = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    hasShadow: false,
    // backgroundColor: "rgba(0, 0, 0, 0)",
    // frame: false,
    resizable: false,
    // fullscreen: true,
    // movable: false,
    webPreferences: {
      preload: path.join(__dirname, "windows", "flashcards", "preload.js"),
    },
    titleBarStyle: "hidden",
  });
  // flashcardsWin.setTrafficLightPosition({ x: 0, y: 0 });
  // flashcardsWin.setAlwaysOnTop(true, "floating");
  // flashcardsWin.on("close", (e) => {
  //   if (!quizFinished) {
  //     const response = dialog.showMessageBoxSync(flashcardsWin, {
  //       type: "question",
  //       buttons: ["Yes", "No"],
  //       title: "Confirm Exit",
  //       message:
  //         "Are you sure you want to exit this quiz session? You can always begin a new session later in your Study Buddy Dashboard.",
  //     });
  //     if (response === 1) e.preventDefault();
  //     // else quitting = false;
  //   }
  // });
  // flashcardsWin.on("closed", () => {
  //   quizFinished = false;
  //   if (quitting) app.quit();
  // });
  // TODO: figure out best way to prevent flashcard "ghosting". the below may be the best route.
  // setInterval(() => {
  //   flashcardsWin.setSize(
  //     flashcardsWin.getSize()[0],
  //     flashcardsWin.getSize()[1] + 1
  //   );
  //   setTimeout(() => {
  //     flashcardsWin.setSize(
  //       flashcardsWin.getSize()[0],
  //       flashcardsWin.getSize()[1] - 1
  //     );
  //   });
  // }, 50);
  flashcardsWin.loadFile("windows/flashcards/index.html");

  // setQuizPosition();
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// min is inclusive and max is exclusive
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}
