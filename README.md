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

For local GUI usage in this repo:

```bash
npm install
npm run gui
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

## GUI Usage

The project now also includes a desktop GUI (Electron):

1. Run `npm install`
2. Run `npm run gui`
3. In the window, choose a PDF, configure options, and click **Run OCR**

The GUI produces the same outputs as the CLI:
- `<prefix>.txt`
- `<prefix>_OCRed.pdf`

## Desktop Distribution (Windows + macOS)

### Download Pre-built Installers

Pre-built desktop applications are automatically generated and attached to [GitHub Releases](../../releases).

**Available downloads:**
- **Windows**: `.exe` installer (NSIS) and portable executable
- **macOS**: `.dmg` installer and universal `.zip` (Intel + Apple Silicon)
- **Linux**: `.AppImage` and `.deb` package

Visit the [Releases page](../../releases) to download the latest version.

### Build Locally

To build desktop installers on your machine:

```bash
npm run dist:win
npm run dist:mac
npm run dist:linux
```

Artifacts are written to the `dist/` folder.

### Automated Releases

Push a version tag to trigger an automatic build:

```bash
git tag v1.0.5
git push origin v1.0.5
```

The CI workflow will:
1. Build Windows & macOS & Linux installers (parallel)
2. Create a GitHub Release
3. Attach all binaries to the release (permanent download links)

This takes ~10-15 minutes. Monitor progress in **Actions** tab.

Notes:
- Building macOS apps is supported on macOS runners/machines.
- Windows builds are generated with NSIS + portable targets.
- For reliable cross-platform output, run CI on both Windows and macOS.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
