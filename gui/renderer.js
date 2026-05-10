const inputPathEl = document.getElementById('inputPath');
const outputPrefixEl = document.getElementById('outputPrefix');
const workersEl = document.getElementById('workers');
const keepTempEl = document.getElementById('keepTemp');
const browseBtn = document.getElementById('browseBtn');
const runBtn = document.getElementById('runBtn');
const statusEl = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const logsEl = document.getElementById('logs');

let totalPages = 0;
let isRunning = false;

function appendLog(message) {
  logsEl.textContent += `${message}\n`;
  logsEl.scrollTop = logsEl.scrollHeight;
}

function setRunning(running) {
  isRunning = running;
  if (running) {
    runBtn.textContent = 'Stop';
    runBtn.style.background = '#dc2626';
  } else {
    runBtn.textContent = 'Run OCR';
    runBtn.style.background = '#2563eb';
  }
  runBtn.disabled = false;
  browseBtn.disabled = running;
}

browseBtn.addEventListener('click', async () => {
  const selectedPath = await window.ocrGui.pickInputPdf();
  if (!selectedPath) {
    return;
  }

  inputPathEl.value = selectedPath;
  if (!outputPrefixEl.value.trim()) {
    const baseName = selectedPath.split('/').pop().replace(/\.pdf$/i, '');
    outputPrefixEl.value = baseName;
  }
});

window.ocrGui.onProgress((event) => {
  if (event.message) {
    appendLog(event.message);
    statusEl.textContent = event.message;
  }

  if (event.totalPages) {
    totalPages = event.totalPages;
    progressBar.value = 0;
  }

  if (event.stage === 'ocr' && totalPages > 0) {
    progressBar.value = Math.round((event.completedPages / totalPages) * 100);
  }

  if (event.stage === 'done') {
    progressBar.value = 100;
  }
});

runBtn.addEventListener('click', async () => {
  // Stop button clicked while running
  if (isRunning) {
    appendLog('Stopping OCR process...');
    await window.ocrGui.cancelOcr();
    statusEl.textContent = 'Cancelled.';
    setRunning(false);
    return;
  }

  const input = inputPathEl.value.trim();
  if (!input) {
    appendLog('Please select an input PDF first.');
    return;
  }

  const outputPrefix = outputPrefixEl.value.trim();
  const workers = parseInt(workersEl.value, 10) || 4;
  const keep = keepTempEl.checked;

  logsEl.textContent = '';
  totalPages = 0;
  progressBar.value = 0;
  setRunning(true);
  statusEl.textContent = 'Starting...';

  try {
    const result = await window.ocrGui.startOcr({
      input,
      outputPrefix,
      workers,
      keep,
    });

    appendLog(`Created: ${result.txtOutput}`);
    appendLog(`Created: ${result.pdfOutput}`);
    statusEl.textContent = 'Completed successfully.';
  } catch (error) {
    if (error.message.includes('cancelled')) {
      appendLog('OCR cancelled by user.');
      statusEl.textContent = 'Cancelled.';
    } else {
      appendLog(`Error: ${error.message}`);
      statusEl.textContent = 'Failed.';
    }
  } finally {
    setRunning(false);
  }
});
