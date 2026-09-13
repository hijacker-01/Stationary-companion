const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

let backendProcess;
let mainWindow;

// Keep the desktop shell usable on older shop PCs and headless verification hosts.
app.disableHardwareAcceleration();

const isPackaged = app.isPackaged;
const backendDir = isPackaged
  ? path.join(process.resourcesPath, "backend")
  : path.join(__dirname, "../backend");
const backendEntry = path.join(backendDir, "server.js");
const frontendUrl = "http://127.0.0.1:5000";

function startBackend() {
  const nodeExecutable = isPackaged ? process.execPath : process.execPath;
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: isPackaged ? "1" : process.env.ELECTRON_RUN_AS_NODE,
    PORT: "5000",
    DB_STORAGE_PATH: process.env.DB_STORAGE_PATH || path.join(app.getPath("userData"), "data", "stationary-companion.db"),
  };
  fs.mkdirSync(path.dirname(env.DB_STORAGE_PATH), { recursive: true });

  backendProcess = spawn(nodeExecutable, [backendEntry], {
    cwd: backendDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const ready = () => {
      if (!settled) { settled = true; resolve(); }
    };
    const fail = (error) => {
      if (!settled) { settled = true; reject(error); }
    };
    const handleStdout = (data) => {
      const text = data.toString();
      console.log(`[backend] ${text.trim()}`);
      if (text.includes("Server running on port")) ready();
    };
    backendProcess.stdout.on("data", handleStdout);
    backendProcess.stderr.on("data", (data) => console.error(`[backend error] ${data.toString().trim()}`));
    backendProcess.once("error", fail);
    backendProcess.once("exit", (code) => {
      if (code !== 0) fail(new Error(`Backend exited before becoming ready (code ${code})`));
    });
    setTimeout(() => fail(new Error("Backend did not become ready within 30 seconds")), 30000);
  });
}

async function createWindow() {
  try {
    await startBackend();
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 1024,
      minHeight: 700,
      icon: path.join(__dirname, "build/icon.png"),
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });
    await mainWindow.loadURL(frontendUrl);
    mainWindow.on("closed", () => { mainWindow = null; });
  } catch (error) {
    console.error("Unable to start Stationary Companion:", error);
    app.quit();
  }
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) backendProcess.kill();
  backendProcess = null;
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", stopBackend);
