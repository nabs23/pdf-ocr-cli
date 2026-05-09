# pdf-ocr-cli

**pdf-ocr-cli** is a lightweight, zero-system-dependency CLI utility designed to bridge the gap between static scanned documents and searchable digital assets. 

Unlike traditional OCR tools that require complex system-level installations of Tesseract and its language data, this tool leverages **Tesseract.js (WebAssembly)** to run the OCR engine directly within the Node.js runtime. It features a parallelized processing pipeline that scales across multiple CPU cores, making it efficient for large documents (100+ pages).

## Key Features

- **Searchable PDF Generation**: Automatically merges OCR text layers back into a high-quality PDF.
- **Parallel Execution**: Configurable worker pools to maximize hardware utilization.
- **Zero-Config OCR**: No need for `tesseract-ocr` system binaries or manual language data management (WASM-based).
- **Dual Output**: Generates both a `.txt` transcription and a searchable `_OCRed.pdf` simultaneously.
- **Developer Friendly**: Built with Node.js, providing a clean CLI interface with real-time progress tracking.

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

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
