# ScanMaster Release Script
# Usage: .\release.ps1 [patch|minor|major] [message]
# Examples:
#   .\release.ps1                    -> v1.0.18 to v1.0.19 (patch)
#   .\release.ps1 minor              -> v1.0.18 to v1.1.0
#   .\release.ps1 major              -> v1.0.18 to v2.0.0
#   .\release.ps1 patch "Bug fixes"  -> v1.0.19: Bug fixes

param(
    [string]$BumpType = "patch",
    [string]$Message = "",
    [switch]$SkipBuild = $false
)

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   ScanMaster Release Tool" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Read current version from package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Info "Current version: v$currentVersion"

# Parse version
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Bump version based on type
switch ($BumpType.ToLower()) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
    }
    "minor" {
        $minor++
        $patch = 0
    }
    "patch" {
        $patch++
    }
    default {
        Write-Warning "Unknown bump type '$BumpType', using 'patch'"
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
Write-Success "New version: v$newVersion"

# Update package.json (without BOM to prevent build errors)
$packageJson.version = $newVersion
$jsonContent = $packageJson | ConvertTo-Json -Depth 100
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path "package.json").Path, $jsonContent, $utf8NoBOM)

# Create commit message
if ($Message -eq "") {
    $commitMessage = "v$newVersion"
    $releaseTitle = "v$newVersion"
} else {
    $commitMessage = "v${newVersion}: $Message"
    $releaseTitle = "v${newVersion}: $Message"
}

Write-Host ""
Write-Info "Commit message: $commitMessage"
Write-Host ""

# Git operations
Write-Info "Adding all changes..."
git add -A

Write-Info "Creating commit..."
git commit -m $commitMessage

Write-Info "Creating tag v$newVersion..."
git tag "v$newVersion"

Write-Info "Pushing to origin..."
git push origin main --tags

# Build Electron app for Windows (unless skipped)
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Info "Building Electron app for Windows..."
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Try to close ScanMaster if running
    Write-Info "Closing ScanMaster if running..."
    Get-Process | Where-Object { $_.ProcessName -like "*Scan*Master*" -or $_.MainWindowTitle -like "*ScanMaster*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    # Clean dist-electron folder
    if (Test-Path "dist-electron") {
        Write-Info "Cleaning dist-electron folder..."
        Remove-Item -Path "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    npm run dist:win
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed! Release created but without installer files."
        Write-Warning "You can manually build later with: npm run dist:win"
    }
}

# Check if GitHub CLI is available for creating releases
$ghAvailable = $null -ne (Get-Command "gh" -ErrorAction SilentlyContinue)

if ($ghAvailable) {
    Write-Host ""
    Write-Info "Creating GitHub Release for auto-update..."
    
    $releaseNotes = "## What's New`n`n"
    if ($Message -ne "") {
        $releaseNotes += "- $Message`n"
    } else {
        $releaseNotes += "- Version bump to v$newVersion`n"
    }
    $releaseNotes += "`n**Full Changelog**: https://github.com/amitay1/Scan-Master-16-12-25/compare/v$currentVersion...v$newVersion"
    
    # Create the release
    gh release create "v$newVersion" --title "$releaseTitle" --notes "$releaseNotes"
    
    # Upload installer files if they exist
    $releaseFolder = "release"
    if (Test-Path $releaseFolder) {
        Write-Info "Uploading installer files to release..."
        
        # First, always upload latest.yml (required for auto-update)
        $latestYml = Join-Path $releaseFolder "latest.yml"
        if (Test-Path $latestYml) {
            Write-Info "  Uploading: latest.yml (required for auto-update)"
            gh release upload "v$newVersion" $latestYml --clobber
        }
        
        # Upload installer files matching artifactName from electron-builder.json
        # artifactName: "ScanMaster-Setup-${version}.${ext}" (hyphens, no spaces)
        $expectedFiles = @(
            "ScanMaster-Setup-$newVersion.exe",
            "ScanMaster-Setup-$newVersion.exe.blockmap",
            "ScanMaster-Portable-$newVersion.exe"
        )

        foreach ($expectedFile in $expectedFiles) {
            $filePath = Join-Path $releaseFolder $expectedFile
            if (Test-Path $filePath) {
                Write-Info "  Uploading: $expectedFile"
                gh release upload "v$newVersion" $filePath --clobber
            } else {
                # Fallback: look for files with spaces and rename
                $spaceVersion = $expectedFile -replace '-', ' '
                $spacePath = Join-Path $releaseFolder $spaceVersion
                if (Test-Path $spacePath) {
                    Write-Info "  Renaming: $spaceVersion -> $expectedFile"
                    Copy-Item $spacePath $filePath -Force
                    gh release upload "v$newVersion" $filePath --clobber
                    Remove-Item $filePath -Force
                } else {
                    Write-Warning "  Not found: $expectedFile (skipping)"
                }
            }
        }
    }
    
    Write-Success "GitHub Release created with installer files!"
} else {
    Write-Host ""
    Write-Warning "GitHub CLI (gh) not installed - skipping GitHub Release creation."
    Write-Warning "Auto-update won't work without a GitHub Release."
    Write-Warning "Install GitHub CLI: winget install GitHub.cli"
    Write-Warning "Then run: gh auth login"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Success "Released v$newVersion successfully!"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($ghAvailable -and -not $SkipBuild) {
    Write-Host "Other computers will auto-update when they open the app!" -ForegroundColor Green
} else {
    Write-Host "To update other computers manually, run:" -ForegroundColor Yellow
    Write-Host "  git pull origin main" -ForegroundColor White
}
Write-Host ""
