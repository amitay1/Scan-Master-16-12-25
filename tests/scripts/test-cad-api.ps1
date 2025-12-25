# PowerShell script to test CAD API
$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = "00000000-0000-0000-0000-000000000000"
}

$body = @{
    shapeType = "box"
    parameters = @{
        material = "aluminum"
        quality = "high" 
        source = "PowerShellTest"
        geometry_type = "box"
        length = 100
        width = 75
        height = 50
    }
} | ConvertTo-Json -Depth 3

Write-Host "Testing CAD Engine API..."
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/cad/engine/parts" -Method POST -Headers $headers -Body $body
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
