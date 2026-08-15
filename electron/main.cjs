const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const DEV_URL = process.env.ELECTRON_START_URL || "http://localhost:5173";

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#0b0b0d",
    title: "LifeWithLLM",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (app.isPackaged) {
    void window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    void window.loadURL(DEV_URL);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
