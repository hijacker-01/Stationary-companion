
const { createWorker } = require("tesseract.js");
const fs = require("fs");

async function test(psm) {
  console.log(`Starting PSM ${psm}...`);
  const worker = await createWorker("eng");
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
  });
  const { data: { text } } = await worker.recognize("test-bill.png");
  fs.writeFileSync(`ocr-psm-${psm}.txt`, text);
  console.log(`PSM ${psm} completed.`);
  await worker.terminate();
}

(async () => {
  try {
    await test("3");
    await test("4");
    await test("6");
    await test("11");
  } catch (err) {
    console.error("OCR Test Error:", err);
  }
})();

