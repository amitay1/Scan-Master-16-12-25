const { PDFParse } = require('pdf-parse');
const path = require('path');
const fs = require('fs');

const file = process.argv[2];
const pageNum = parseInt(process.argv[3] || '14', 10);
const outDir = path.resolve('scripts/pdf-images');

if (!file) { console.error('Usage: node pdf-screenshot.cjs <file> [page]'); process.exit(1); }
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const fullPath = path.resolve(file);

async function run() {
  const data = new Uint8Array(fs.readFileSync(fullPath));
  const parser = new PDFParse({ verbosity: 0, data });

  // Try getScreenshot for specific pages
  console.log('Attempting screenshot of page', pageNum, '...');
  try {
    const screenshots = await parser.getScreenshot({
      pages: [pageNum],
      scale: 2.0,
      imageBuffer: true,
    });

    if (screenshots && screenshots.pages) {
      for (const pg of screenshots.pages) {
        const outFile = path.join(outDir, `page-${pg.pageNumber || pageNum}.png`);
        if (pg.data && pg.data.length > 0) {
          // pg.data is RGBA pixel data, need to convert to PNG
          console.log(`Page ${pg.pageNumber}: ${pg.width}x${pg.height}, data length: ${pg.data.length}`);
          // Save raw RGBA data info
          console.log('Raw RGBA data - need canvas to convert to PNG');
        }
        if (pg.dataUrl) {
          const base64 = pg.dataUrl.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(outFile, Buffer.from(base64, 'base64'));
          console.log(`Saved: ${outFile}`);
        }
      }
    } else {
      console.log('No screenshots returned');
    }
  } catch(e) {
    console.error('Screenshot failed:', e.message);
  }

  // Also try getImage to extract embedded images
  console.log('\nAttempting image extraction...');
  try {
    const images = await parser.getImage({
      pages: [pageNum],
    });

    if (images && images.pages) {
      for (const pg of images.pages) {
        console.log(`Page images:`, JSON.stringify(pg).substring(0, 500));
      }
    } else if (images) {
      console.log('Images result:', Object.keys(images));
    }
  } catch(e) {
    console.error('Image extraction failed:', e.message);
  }
}

run().catch(e => console.error('Fatal:', e.message));
