// Minimal test to isolate the spawn issue
import { spawn } from 'child_process';
import path from 'path';

const pythonBin = "D:\\ScanMaster_CAD_Engine\\venv\\Scripts\\python.exe";
const cadScript = "D:\\ScanMaster_CAD_Engine\\scanmaster_cli.py";
const jobFile = "D:\\Scan-Master-Replit_NEW\\Scan-Master\\cad-engine-jobs\\1763410213577-03piqy.json";

console.log('Testing spawn process...');
console.log('Python:', pythonBin);
console.log('Script:', cadScript);
console.log('Job file:', jobFile);

const child = spawn(pythonBin, [cadScript, "--json", jobFile], {
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (chunk) => {
  stdout += chunk.toString();
  console.log('STDOUT chunk:', chunk.toString());
});

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
  console.log('STDERR chunk:', chunk.toString());
});

child.on("error", (err) => {
  console.error('Process error:', err);
});

child.on("close", (code) => {
  console.log(`Process closed with code: ${code}`);
  console.log('Final stdout:', stdout);
  console.log('Final stderr:', stderr);
  
  // Try to parse stdout
  try {
    const parsed = JSON.parse(stdout);
    console.log('Parsed JSON:', parsed);
    console.log('Success flag:', parsed.success);
  } catch (e) {
    console.log('JSON parse error:', e.message);
  }
});