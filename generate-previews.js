#!/usr/bin/env node

/**
 * Generate high-quality PNG previews from Excalidraw library,
 * serving Excalifont locally over HTTP instead of embedding as a data URI.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

async function generatePreviews() {
  console.log('🚀 Generating Excalidraw library previews…');

  // 1) Start a simple HTTP server to serve Excalifont.woff2 with CORS
  const fontDir = path.join(__dirname, 'fonts');
  const fontFileName = 'Excalifont.woff2';
  const fontPath = path.join(fontDir, fontFileName);
  const fontPort = 1234;

  if (!fs.existsSync(fontPath)) {
    console.error(
      `❌ Font not found at ${fontPath}. Please place Excalifont.woff2 in the 'fonts' directory.`
    );
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    if (req.url === '/' + fontFileName) {
      // Serve the .woff2 file with appropriate headers
      const data = fs.readFileSync(fontPath);
      res.writeHead(200, {
        'Content-Type': 'font/woff2',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => {
    server.listen(fontPort, () => {
      console.log(
        `🔊 Static font server running at http://localhost:${fontPort}/${fontFileName}`
      );
      resolve();
    });
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 2) Patch CanvasRenderingContext2D.prototype.font before any HTML loads
    await page.evaluateOnNewDocument(() => {
      const desc = Object.getOwnPropertyDescriptor(
        CanvasRenderingContext2D.prototype,
        'font'
      );
      if (!desc || !desc.set) return;
      const origSetter = desc.set;
      const newDesc = {
        get: desc.get,
        set: function (val) {
          // Replace any of Excalidraw's default font families with "Excalifont"
          const replaced = val.replace(
            /\b(Virgil(?:-[A-Za-z0-9]+)?|Helvetica|Arial|sans-serif|serif|monospace)\b/g,
            'Excalifont'
          );
          origSetter.call(this, replaced);
        },
        enumerable: desc.enumerable,
        configurable: desc.configurable,
      };
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', newDesc);
    });

    // 3) Build the HTML that references the locally hosted font
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: 'Excalifont';
        src: url('http://localhost:${fontPort}/${fontFileName}') format('woff2');
        font-display: block;
      }
      /* Force the body to use Excalifont so Chrome begins loading it immediately */
      body {
        font-family: 'Excalifont', sans-serif !important;
      }
    </style>
    <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.js"></script>
  </head>
  <body>
    <div id="canvas"></div>
    <script>
      window.EXCALIDRAW_ASSET_PATH = '';
      window.renderItem = async (elements) => {
        const container = document.getElementById('canvas');
        container.innerHTML = '';

        // Wait for the font to be fully registered
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }

        const restored = ExcalidrawLib.restoreElements(elements);

        // (Optional) Log out any text elements to confirm their fontFamily
        const texts = restored.filter((el) => el.type === 'text');
        console.log('Text elements:', texts.length);
        texts.forEach((t) => {
          console.log('  → "text":', t.text, 'fontFamily:', t.fontFamily);
        });

        const exportCanvas = await ExcalidrawLib.exportToCanvas({
          elements: restored,
          appState: {
            exportBackground: true,
            viewBackgroundColor: '#ffffff',
            exportWithDarkMode: false,
            exportPadding: 20,
          },
          files: {},
        });
        container.appendChild(exportCanvas);
        return {
          success: true,
          width: exportCanvas.width,
          height: exportCanvas.height,
          hasText: texts.length > 0,
        };
      };
    </script>
  </body>
</html>`;

    // 4) Load the HTML and wait until no more network activity (so the font can be fetched)
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 5) Confirm that Excalifont is registered
    try {
      await page.waitForFunction(
        () => document.fonts.check('20px Excalifont') === true,
        { timeout: 10000 }
      );
      console.log('✅ Excalifont is registered in the browser.');
    } catch {
      console.warn(
        '⚠️ Excalifont did NOT register within 10 seconds. Exports may fall back to a generic font.'
      );
    }

    console.log('✅ Excalidraw ready');

    // 6) Load your .excalidrawlib file and generate previews
    const libraryPath = path.join(__dirname, 'carys-visual-vocabulary.excalidrawlib');
    if (!fs.existsSync(libraryPath)) {
      console.error(`❌ Library file not found at ${libraryPath}`);
      return;
    }

    const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    const outputDir = path.join(__dirname, 'previews');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    console.log(`📚 Processing ${library.libraryItems.length} items…`);
    for (let i = 0; i < library.libraryItems.length; i++) {
      const item = library.libraryItems[i];
      if (!item.elements || item.elements.length === 0) {
        console.log(`   ⚠️ Item ${i + 1}: no elements, skipping`);
        continue;
      }

      try {
        const result = await page.evaluate((els) => window.renderItem(els), item.elements);
        if (!result.success) {
          console.log(`   ❌ Item ${i + 1}: ${result.error}`);
          continue;
        }

        const canvasHandle = await page.$('canvas');
        if (!canvasHandle) {
          console.log(`   ❌ Item ${i + 1}: no <canvas> found`);
          continue;
        }

        const filename = `item-${String(i + 1).padStart(3, '0')}.png`;
        await canvasHandle.screenshot({
          path: path.join(outputDir, filename),
          omitBackground: false,
        });

        const hasText = result.hasText ? ' [HAS TEXT]' : ' [no text]';
        console.log(
          `   ✅ Item ${i + 1}: ${filename} (${result.width}×${result.height})${hasText}`
        );
      } catch (e) {
        console.log(`   ❌ Item ${i + 1}: ${(e && e.message) || e}`);
      }
    }

    console.log('🎉 Preview generation complete');
  } finally {
    await browser.close();
    server.close(() => {
      console.log('🛑 Static font server stopped');
    });
  }
}

if (require.main === module) {
  generatePreviews().catch((err) => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
}
