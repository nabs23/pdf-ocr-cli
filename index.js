#!/usr/bin/env node

const { Command } = require('commander');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cliProgress = require('cli-progress');

const program = new Command();

program
  .name('pdf-ocr')
  .description('OCR a PDF and generate searchable PDF and TXT versions')
  .version('1.0.0')
  .argument('<input>', 'Input PDF file')
  .option('-o, --output <prefix>', 'Output prefix', '')
  .option('-w, --workers <number>', 'Number of parallel workers', '4')
  .option('-k, --keep', 'Keep temporary files', false)
  .action(async (input, options) => {
    const inputPath = path.resolve(input);
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File ${input} does not exist.`);
      process.exit(1);
    }

    const outputPrefix = options.output || path.parse(input).name;
    const numWorkers = parseInt(options.workers);
    const tempDir = path.join(process.cwd(), `ocr_temp_${Date.now()}`);
    const imgDir = path.join(tempDir, 'images');
    const pdfDir = path.join(tempDir, 'pdfs');

    try {
      // 1. Setup
      console.log(`[*] Initializing OCR for: ${input}`);
      fs.mkdirSync(imgDir, { recursive: true });
      fs.mkdirSync(pdfDir, { recursive: true });

      // 2. Convert PDF to Images
      console.log(`[*] Converting PDF to images (this may take a while)...`);
      execSync(`pdftoppm -jpeg -r 300 "${inputPath}" "${path.join(imgDir, 'page')}"`);
      const images = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg')).sort();
      const totalPages = images.length;
      console.log(`[*] Found ${totalPages} pages.`);

      // 3. Setup OCR
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
      progressBar.start(totalPages, 0);

      const scheduler = Tesseract.createScheduler();
      for (let i = 0; i < numWorkers; i++) {
        const worker = await Tesseract.createWorker('eng', 1);
        scheduler.addWorker(worker);
      }

      const results = new Array(totalPages);
      const tasks = images.map((imgName, index) => {
        const filePath = path.join(imgDir, imgName);
        const pageNum = index + 1;
        const paddedNum = pageNum.toString().padStart(3, '0');
        const pdfPath = path.join(pdfDir, `page-${paddedNum}.pdf`);

        return scheduler.addJob('recognize', filePath, { pdfTitle: `Page ${pageNum}` }, { pdf: true })
          .then(res => {
            results[index] = res.data.text;
            fs.writeFileSync(pdfPath, Buffer.from(res.data.pdf));
            progressBar.update(index + 1);
          });
      });

      await Promise.all(tasks);
      progressBar.stop();
      await scheduler.terminate();

      // 4. Combine Results
      console.log(`[*] Finalizing output files...`);
      
      // Save Text
      const fullText = results.map((text, i) => `--- Page ${i + 1} ---\n${text}\n\n`).join('');
      fs.writeFileSync(`${outputPrefix}.txt`, fullText);

      // Merge PDFs
      execSync(`gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile="${outputPrefix}_OCRed.pdf" "${pdfDir}/page-"*.pdf`);

      console.log(`[+] Success! Created:`);
      console.log(`    - ${outputPrefix}.txt`);
      console.log(`    - ${outputPrefix}_OCRed.pdf`);

    } catch (err) {
      console.error(`\n[!] Error during OCR:`, err.message);
    } finally {
      if (!options.keep && fs.existsSync(tempDir)) {
        console.log(`[*] Cleaning up temporary files...`);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

program.parse();
