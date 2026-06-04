const { parentPort, workerData } = require("worker_threads");
const sharp = require("sharp");
const { createWorker } = require("tesseract.js");
const fs = require("fs");

async function processOCR() {
  const { rawFilePath, processedFilePath } = workerData;
  let worker = null;
  
  try {
    // 1. Image Pre-processing with Sharp
    await sharp(rawFilePath)
      .resize({ width: 1800, withoutEnlargement: true })
      .grayscale()
      .clahe({ width: 200, height: 200, maxSlope: 3 })
      .normalize()
      .sharpen({ sigma: 1, m1: 2, m2: 2 })
      .threshold(140)
      .toFile(processedFilePath);

    // 2. OCR with Tesseract
    worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/.-% ",
    });

    const { data: { text } } = await worker.recognize(processedFilePath);
    
    // Send successful result
    parentPort.postMessage({ success: true, text });

  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  } finally {
    if (worker) await worker.terminate();
    // Cleanup temporary files
    try {
      if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
      if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
    } catch (e) {
      console.error("Cleanup error in worker:", e);
    }
  }
}

processOCR();
