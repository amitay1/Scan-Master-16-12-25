// Simple test using curl via child process
import { spawn } from 'child_process';

function testCadEngine() {
  console.log('Testing CAD Engine API...');
  
  const curlProcess = spawn('curl', [
    '-X', 'POST',
    'http://localhost:5000/api/cad/engine/parts',
    '-H', 'Content-Type: application/json',
    '-H', 'x-user-id: 00000000-0000-0000-0000-000000000000',
    '-d', JSON.stringify({
      shapeType: 'box',
      parameters: {
        material: 'aluminum',
        quality: 'high',
        source: 'ScanMaster TechnicalDrawingTest',
        geometry_type: 'box',
        length: 100,
        width: 75,
        height: 50
      }
    })
  ]);

  let stdout = '';
  let stderr = '';

  curlProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  curlProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  curlProcess.on('close', (code) => {
    if (code === 0) {
      try {
        const result = JSON.parse(stdout);
        console.log('✅ CAD Engine API Success:', result);
      } catch (e) {
        console.log('Response:', stdout);
      }
    } else {
      console.log('❌ Curl failed with code:', code);
      console.log('Error:', stderr);
    }
  });

  curlProcess.on('error', (error) => {
    console.error('❌ Failed to start curl:', error.message);
    
    // Fallback: Try using Windows built-in Invoke-WebRequest
    console.log('Trying PowerShell Invoke-WebRequest...');
    const psScript = `
      $headers = @{"Content-Type"="application/json"; "x-user-id"="00000000-0000-0000-0000-000000000000"}
      $body = '${JSON.stringify({
        shapeType: 'box',
        parameters: {
          material: 'aluminum',
          quality: 'high',
          source: 'ScanMaster TechnicalDrawingTest',
          geometry_type: 'box',
          length: 100,
          width: 75,
          height: 50
        }
      })}'
      try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/cad/engine/parts" -Method POST -Headers $headers -Body $body
        Write-Output $response.Content
      } catch {
        Write-Output "Error: $($_.Exception.Message)"
      }
    `;
    
    const psProcess = spawn('powershell', ['-Command', psScript]);
    
    psProcess.stdout.on('data', (data) => {
      console.log('PowerShell Response:', data.toString());
    });
    
    psProcess.stderr.on('data', (data) => {
      console.log('PowerShell Error:', data.toString());
    });
  });
}

testCadEngine();