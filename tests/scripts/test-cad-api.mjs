// Test script for CAD Engine API (ES Module)
import fetch from 'node-fetch';

async function testCadEngine() {
  try {
    console.log('Testing CAD Engine API...');
    
    const response = await fetch('http://localhost:5000/api/cad/engine/parts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-0000-0000-000000000000'
      },
      body: JSON.stringify({
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
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ CAD Engine API Success:', result);
    } else {
      console.log('❌ CAD Engine API Error:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testCadEngine();