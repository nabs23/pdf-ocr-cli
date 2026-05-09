# pdf-ocr-cli

A lightweight, zero-system-dependency (WASM-based) CLI tool to OCR PDF files. It generates both a searchable PDF and a structured plain text file.

## Features

- **Zero System OCR Dependency**: Uses `tesseract.js` (WebAssembly), so you don't need to install Tesseract natively.
- **Parallel Processing**: Utilizes multiple CPU cores for faster OCR.
- **Progress Tracking**: Real-time progress bar for long documents.
- **Searchable PDF**: Merges OCRed layers back into a standard PDF format.

## Prerequisites

This tool requires the following system utilities to be present:
- `poppler-utils` (for `pdftoppm`)
- `ghostscript` (for `gs`)

## Installation

```bash
npm install -g pdf-ocr-cli
```

## Usage

```bash
pdf-ocr input.pdf
```

### Options

- `-o, --output <prefix>`: Custom prefix for output files (defaults to input filename).
- `-w, --workers <number>`: Number of parallel workers (default: 4).
- `-k, --keep`: Keep temporary image files after completion.
- `-h, --help`: Show help.

## License

ISC
