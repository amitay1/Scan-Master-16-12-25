const { PDFParse } = require('pdf-parse');
const path = require('path');
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('Usage: node read-pdf.cjs <file>'); process.exit(1); }

const fullPath = path.resolve(file);

async function run() {
  // Try passing as {url: filePath}
  const parser = new PDFParse({ verbosity: 0, url: fullPath });
  const result = await parser.getText();

  if (result && result.pages) {
    for (const pg of result.pages) {
      console.log(`\n=== PAGE ${pg.num || pg.pageNumber || '?'} ===`);
      console.log(pg.text);
    }
  } else if (result && result.text) {
    console.log(result.text);
  } else if (typeof result === 'string') {
    console.log(result);
  } else {
    console.log('Result:', JSON.stringify(result, null, 2).substring(0, 10000));
  }
}

run().catch(async e => {
  console.error('Attempt 1 failed:', e.message);

  // Attempt 2: data as Uint8Array
  try {
    const data = new Uint8Array(fs.readFileSync(fullPath));
    const parser2 = new PDFParse({ verbosity: 0, data: data });
    const result2 = await parser2.getText();

    if (result2 && result2.pages) {
      for (const pg of result2.pages) {
        console.log(`\n=== PAGE ${pg.num || pg.pageNumber || '?'} ===`);
        console.log(pg.text);
      }
    } else if (typeof result2 === 'string') {
      console.log(result2);
    } else {
      console.log('Result2:', JSON.stringify(result2, null, 2).substring(0, 10000));
    }
  } catch(e2) {
    console.error('Attempt 2 failed:', e2.message);
  }
});
