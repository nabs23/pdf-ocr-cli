const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runOcr({ input, outputPrefix = '', workers = 4, keep = false, onProgress = () => {}, signal = null }) {
  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`File ${input} does not exist.`);
  }

  if (signal && signal.aborted) {
    throw new Error('OCR process was cancelled.');
  }

  const resolvedOutputPrefix = outputPrefix || path.parse(inputPath).name;
  const numWorkers = parseInt(workers, 10);
  const tempDir = path.join(process.cwd(), `ocr_temp_${Date.now()}`);
  const imgDir = path.join(tempDir, 'images');
  const pdfDir = path.join(tempDir, 'pdfs');

  try {
    onProgress({ stage: 'setup', message: `Initializing OCR for: ${inputPath}` });
    fs.mkdirSync(imgDir, { recursive: true });
    fs.mkdirSync(pdfDir, { recursive: true });

    onProgress({ stage: 'convert', message: 'Converting PDF to images...' });
    execSync(`pdftoppm -jpeg -r 300 "${inputPath}" "${path.join(imgDir, 'page')}"`);
    const images = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg')).sort();
    const totalPages = images.length;

    if (totalPages === 0) {
      throw new Error('No pages were extracted from the PDF.');
    }

    onProgress({ stage: 'convert', message: `Found ${totalPages} pages.`, totalPages, completedPages: 0 });

    if (signal && signal.aborted) {
      throw new Error('OCR process was cancelled.');
    }

    const scheduler = Tesseract.createScheduler();
    for (let i = 0; i < numWorkers; i++) {
      const worker = await Tesseract.createWorker('eng', 1);
      scheduler.addWorker(worker);
    }

    const results = new Array(totalPages);
    let completedPages = 0;

    const abortListener = () => {
      scheduler.terminate();
    };

    if (signal) {
      signal.addEventListener('abort', abortListener);
    }

    const tasks = images.map((imgName, index) => {
      const filePath = path.join(imgDir, imgName);
      const pageNum = index + 1;
      const paddedNum = pageNum.toString().padStart(3, '0');
      const pdfPath = path.join(pdfDir, `page-${paddedNum}.pdf`);

      return scheduler
        .addJob('recognize', filePath, { pdfTitle: `Page ${pageNum}` }, { pdf: true })
        .then(res => {
          if (signal && signal.aborted) {
            throw new Error('OCR process was cancelled.');
          }
          results[index] = res.data.text;
          fs.writeFileSync(pdfPath, Buffer.from(res.data.pdf));
          completedPages += 1;
          onProgress({
            stage: 'ocr',
            message: `OCR progress: ${completedPages}/${totalPages}`,
            totalPages,
            completedPages,
          });
        });
    });

    await Promise.all(tasks);
    await scheduler.terminate();

    if (signal) {
      signal.removeEventListener('abort', abortListener);
    }

    if (signal && signal.aborted) {
      throw new Error('OCR process was cancelled.');
    }

    onProgress({ stage: 'finalize', message: 'Finalizing output files...' });

    const fullText = results.map((text, i) => `--- Page ${i + 1} ---\n${text}\n\n`).join('');
    const txtOutput = `${resolvedOutputPrefix}.txt`;
    const pdfOutput = `${resolvedOutputPrefix}_OCRed.pdf`;

    fs.writeFileSync(txtOutput, fullText);
    execSync(`gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile="${pdfOutput}" "${pdfDir}/page-"*.pdf`);

    onProgress({ stage: 'done', message: 'OCR complete.' });

    return {
      txtOutput,
      pdfOutput,
      totalPages,
    };
  } finally {
    if (!keep && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

module.exports = {
  runOcr,
};
