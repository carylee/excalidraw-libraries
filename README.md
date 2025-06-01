# Excalidraw Library Preview Generator

Generate high-quality PNG previews for all items in an Excalidraw library file using authentic Excalidraw rendering and fonts.

## 🚀 Quick Start

```bash
# Setup (downloads Puppeteer and Excalifont)
npm run setup

# Generate previews
npm run generate
```

## 📁 Output

- Creates `previews/` directory
- Generates `item-001.png`, `item-002.png`, etc.
- Uses authentic Excalidraw rendering with proper fonts
- White background with appropriate padding

## ✨ Features

- **Authentic rendering**: Uses official Excalidraw export functions
- **Proper fonts**: Loads Excalifont-Regular.woff2 (the current Excalidraw font)
- **High quality**: Full-resolution PNG output
- **Simple**: Single command, single approach
- **Robust**: Handles errors gracefully

## 🔧 How It Works

1. Launches headless Chrome via Puppeteer
2. Loads Excalidraw library in browser context
3. Embeds Excalifont-Regular.woff2 as base64
4. Uses `ExcalidrawLib.exportToCanvas()` for each item
5. Screenshots the resulting canvas

## 📋 Requirements

- Node.js
- Internet connection (for setup)

## 🐛 Troubleshooting

**Font issues**: The script automatically downloads the correct font. If you see Times New Roman, check that `fonts/Excalifont-Regular.woff2` exists.

**Setup fails**: Run setup manually:
```bash
npm install puppeteer
mkdir -p fonts
curl -L -o fonts/Excalifont-Regular.woff2 https://github.com/excalidraw/excalidraw/raw/master/public/Excalifont-Regular.woff2
```

**Browser issues**: The script uses `--no-sandbox` for compatibility. On some systems you may need additional Chrome dependencies.

## 🎯 Code Quality

- Single responsibility: does one thing well
- Clear error handling with helpful messages  
- No dead code or multiple approaches
- Uses official Excalidraw APIs
- Minimal dependencies

## 🖼️ Library Preview

| Item | Preview |
|------|---------|
| 001 | ![item-001.png](previews/item-001.png) |
| 002 | ![item-002.png](previews/item-002.png) |
| 003 | ![item-003.png](previews/item-003.png) |
| 004 | ![item-004.png](previews/item-004.png) |
| 005 | ![item-005.png](previews/item-005.png) |
| 006 | ![item-006.png](previews/item-006.png) |
| 007 | ![item-007.png](previews/item-007.png) |
| 008 | ![item-008.png](previews/item-008.png) |
| 009 | ![item-009.png](previews/item-009.png) |
| 010 | ![item-010.png](previews/item-010.png) |
| 011 | ![item-011.png](previews/item-011.png) |
| 012 | ![item-012.png](previews/item-012.png) |
| 013 | ![item-013.png](previews/item-013.png) |
| 014 | ![item-014.png](previews/item-014.png) |
| 015 | ![item-015.png](previews/item-015.png) |
| 016 | ![item-016.png](previews/item-016.png) |
| 017 | ![item-017.png](previews/item-017.png) |
| 018 | ![item-018.png](previews/item-018.png) |
| 019 | ![item-019.png](previews/item-019.png) |
| 020 | ![item-020.png](previews/item-020.png) |
| 021 | ![item-021.png](previews/item-021.png) |
| 022 | ![item-022.png](previews/item-022.png) |
| 023 | ![item-023.png](previews/item-023.png) |
| 024 | ![item-024.png](previews/item-024.png) |
| 025 | ![item-025.png](previews/item-025.png) |
| 026 | ![item-026.png](previews/item-026.png) |
| 027 | ![item-027.png](previews/item-027.png) |
| 028 | ![item-028.png](previews/item-028.png) |
| 029 | ![item-029.png](previews/item-029.png) |
| 030 | ![item-030.png](previews/item-030.png) |
| 031 | ![item-031.png](previews/item-031.png) |
| 032 | ![item-032.png](previews/item-032.png) |
| 033 | ![item-033.png](previews/item-033.png) |
| 034 | ![item-034.png](previews/item-034.png) |
