const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  electronStore: {
    get: (key) => ipcRenderer.invoke("electron-store-get", key),
  },
});
