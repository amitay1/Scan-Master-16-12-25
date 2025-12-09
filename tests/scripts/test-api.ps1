# PowerShell script to test the fixed CAD API
$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = "00000000-0000-0000-0000-000000000000"
}

$body = @{
    shapeType = "cylinder"
    parameters = @{
        material = "steel"
        quality = "high"
        source = "PowerShellTest"
        geometry_type = "cylinder"
        diameter = 50
        height = 100
    }
} | ConvertTo-Json -Depth 3

Write-Host "Testing CAD Engine API..." -ForegroundColor Yellow
Write-Host "Making POST request to http://localhost:5000/api/cad/engine/parts"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/cad/engine/parts" -Method POST -Headers $headers -Body $body
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
    
    if ($response.stepUrl) {
        Write-Host "STEP file URL: $($response.stepUrl)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")