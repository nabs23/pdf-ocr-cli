#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const cliProgress = require('cli-progress');
const { runOcr } = require('./ocr');

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
    const outputPrefix = options.output || path.parse(inputPath).name;
    const numWorkers = parseInt(options.workers, 10);
    let progressBar;
    let progressStarted = false;

    try {
      const result = await runOcr({
        input: inputPath,
        outputPrefix,
        workers: numWorkers,
        keep: options.keep,
        onProgress: (event) => {
          if (event.stage === 'setup') {
            console.log(`[*] ${event.message}`);
            return;
          }

          if (event.stage === 'convert') {
            if (typeof event.totalPages === 'number') {
              console.log(`[*] Found ${event.totalPages} pages.`);
              progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
              progressBar.start(event.totalPages, 0);
              progressStarted = true;
            } else {
              console.log(`[*] ${event.message}`);
            }
            return;
          }

          if (event.stage === 'ocr' && progressStarted) {
            progressBar.update(event.completedPages);
            return;
          }

          if (event.stage === 'finalize') {
            if (progressStarted) {
              progressBar.stop();
              progressStarted = false;
            }
            console.log(`[*] ${event.message}`);
          }
        },
      });

      console.log(`[+] Success! Created:`);
      console.log(`    - ${result.txtOutput}`);
      console.log(`    - ${result.pdfOutput}`);

    } catch (err) {
      if (progressStarted) {
        progressBar.stop();
      }
      console.error(`\n[!] Error during OCR:`, err.message);
    } finally {
      if (!options.keep) {
        console.log(`[*] Cleaning up temporary files...`);
      }
    }
  });

program.parse();
