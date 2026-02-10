import pkg from 'pdf-parse';
import { readFileSync } from 'fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node read-pdf.mjs <file>'); process.exit(1); }

console.log('Module type:', typeof pkg);
console.log('Keys:', Object.keys(pkg));

// Try to find the right export
const PDFParse = pkg.PDFParse || pkg.default || pkg;
console.log('PDFParse type:', typeof PDFParse);

const parser = new PDFParse({ verbosity: 0 });
console.log('Parser methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));

const buf = readFileSync(file);

// Try getText method
if (typeof parser.getText === 'function') {
  const result = await parser.getText(buf);
  console.log(result);
} else if (typeof parser.loadPDF === 'function') {
  const result = await parser.loadPDF(buf);
  console.log(result);
} else {
  // Try calling methods
  for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(parser))) {
    if (key !== 'constructor') console.log(`  method: ${key}`);
  }
}
