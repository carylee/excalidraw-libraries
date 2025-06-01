#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * Generate high-quality PNG previews from Excalidraw library
 * Uses Puppeteer + official Excalidraw rendering with proper fonts
 */

async function generatePreviews() {
    console.log('🚀 Generating Excalidraw library previews...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        // Enable console logging from browser
        page.on('console', msg => {
            if (msg.text().includes('Text elements') || msg.text().includes('Font') || msg.text().includes('font')) {
                console.log(`   🔍 ${msg.text()}`);
            }
        });
        
        // Load Excalifont if available
        const fontPath = path.join(__dirname, 'fonts', 'Excalifont-Regular.woff2');
        let fontBase64 = '';
        
        if (fs.existsSync(fontPath)) {
            fontBase64 = fs.readFileSync(fontPath).toString('base64');
            console.log('✅ Excalifont loaded');
        } else {
            console.log('⚠️  Excalifont not found, download from: https://github.com/excalidraw/excalidraw/blob/master/public/Excalifont-Regular.woff2');
        }
        
        // Create HTML with Excalidraw and proper font
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    ${fontBase64 ? `
    <style>
        @font-face {
            font-family: 'Excalifont';
            src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
            font-display: block;
        }
        /* Ensure Excalidraw uses our font */
        * {
            font-family: 'Excalifont', cursive !important;
        }
    </style>` : ''}
    <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.js"></script>
</head>
<body>
    <div id="canvas"></div>
    <script>
        // Override Excalidraw's font loading to use our font
        window.EXCALIDRAW_ASSET_PATH = '';
        
        // Monkey patch canvas 2D context to intercept font changes
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
            const context = originalGetContext.call(this, contextType, ...args);
            if (contextType === '2d' && context && !context._fontPatched) {
                // Mark as patched to avoid double-patching
                context._fontPatched = true;
                
                // Store original font setter
                const originalFontDescriptor = Object.getOwnPropertyDescriptor(context, 'font') ||
                    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(context), 'font') ||
                    Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
                
                if (originalFontDescriptor && originalFontDescriptor.set) {
                    const originalSetter = originalFontDescriptor.set;
                    
                    // Override font setter
                    const newDescriptor = {
                        get: originalFontDescriptor.get,
                        set: function(value) {
                            // Replace font families with Excalifont
                            const modifiedFont = value.replace(
                                /\b(Virgil|Helvetica|Arial|sans-serif|serif|monospace)\b/g,
                                'Excalifont'
                            );
                            originalSetter.call(this, modifiedFont);
                        },
                        enumerable: originalFontDescriptor.enumerable,
                        configurable: originalFontDescriptor.configurable
                    };
                    
                    try {
                        Object.defineProperty(context, 'font', newDescriptor);
                    } catch (e) {
                        // If we can't redefine, try prototype patching
                        console.log('Fallback font patching');
                    }
                }
            }
            return context;
        };
        
        window.renderItem = async (elements) => {
            const canvas = document.getElementById('canvas');
            canvas.innerHTML = '';
            
            try {
                // Wait for font to be ready
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }
                
                const restoredElements = ExcalidrawLib.restoreElements(elements);
                
                // Debug: Check if we have text elements and what fonts they use
                const textElements = restoredElements.filter(el => el.type === 'text');
                console.log('Text elements found:', textElements.length);
                textElements.forEach(el => {
                    console.log('Text element:', el.text, 'fontFamily:', el.fontFamily);
                });
                
                // Test font availability
                const testCanvas = document.createElement('canvas');
                const testCtx = testCanvas.getContext('2d');
                testCtx.font = '20px Excalifont';
                console.log('Test context font set to:', testCtx.font);
                
                // Test if font is actually available
                const fontCheck = document.fonts.check('20px Excalifont');
                console.log('Font availability check:', fontCheck);
                
                const exportCanvas = await ExcalidrawLib.exportToCanvas({
                    elements: restoredElements,
                    appState: {
                        exportBackground: true,
                        viewBackgroundColor: '#ffffff',
                        exportWithDarkMode: false,
                        exportPadding: 20
                    },
                    files: {}
                });
                
                canvas.appendChild(exportCanvas);
                return {
                    success: true,
                    width: exportCanvas.width,
                    height: exportCanvas.height,
                    hasText: textElements.length > 0
                };
            } catch (error) {
                console.error('Render failed:', error);
                return { success: false, error: error.message };
            }
        };
    </script>
</body>
</html>`;
        
        await page.setContent(html);
        
        // Wait for Excalidraw to load
        await page.waitForFunction(() => {
            return window.ExcalidrawLib && 
                   window.ExcalidrawLib.exportToCanvas &&
                   window.ExcalidrawLib.restoreElements;
        }, { timeout: 30000 });
        
        console.log('✅ Excalidraw ready');
        
        // Load library data
        const libraryPath = path.join(__dirname, 'carys-pictograms.excalidrawlib');
        const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
        
        // Create output directory
        const outputDir = path.join(__dirname, 'previews');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        
        console.log(`📚 Processing ${library.libraryItems.length} items...`);
        
        // Process each item
        for (let i = 0; i < library.libraryItems.length; i++) {
            const item = library.libraryItems[i];
            
            if (!item.elements || item.elements.length === 0) {
                console.log(`   ⚠️  Item ${i + 1}: No elements, skipping`);
                continue;
            }
            
            try {
                // Render item
                const result = await page.evaluate((elements) => {
                    return window.renderItem(elements);
                }, item.elements);
                
                if (!result.success) {
                    console.log(`   ❌ Item ${i + 1}: ${result.error}`);
                    continue;
                }
                
                // Screenshot the canvas
                const canvas = await page.$('canvas');
                if (!canvas) {
                    console.log(`   ❌ Item ${i + 1}: No canvas found`);
                    continue;
                }
                
                const filename = `item-${String(i + 1).padStart(3, '0')}.png`;
                await canvas.screenshot({
                    path: path.join(outputDir, filename),
                    omitBackground: false
                });
                
                const textInfo = result.hasText ? ' [HAS TEXT]' : ' [no text]';
                console.log(`   ✅ Item ${i + 1}: ${filename} (${result.width}×${result.height})${textInfo}`);
                
            } catch (error) {
                console.log(`   ❌ Item ${i + 1}: ${error.message}`);
            }
        }
        
        console.log('🎉 Preview generation complete');
        
    } finally {
        await browser.close();
    }
}

// Handle errors gracefully
async function main() {
    try {
        await generatePreviews();
    } catch (error) {
        console.error('💥 Error:', error.message);
        console.error('\n💡 Setup required:');
        console.error('   npm install puppeteer');
        console.error('   Download fonts/Excalifont-Regular.woff2 from Excalidraw repo');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}