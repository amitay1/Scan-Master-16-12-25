# ScanMaster Release Script
# Usage: .\release.ps1 [patch|minor|major] [message]
# Examples:
#   .\release.ps1                    -> v1.0.18 to v1.0.19 (patch)
#   .\release.ps1 minor              -> v1.0.18 to v1.1.0
#   .\release.ps1 major              -> v1.0.18 to v2.0.0
#   .\release.ps1 patch "Bug fixes"  -> v1.0.19: Bug fixes

param(
    [string]$BumpType = "patch",
    [string]$Message = ""
)

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }

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

# Update package.json
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 100 | Set-Content "package.json" -Encoding UTF8

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
    
    gh release create "v$newVersion" --title "$releaseTitle" --notes "$releaseNotes"
    
    Write-Success "GitHub Release created! Auto-update will work on other computers."
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

if ($ghAvailable) {
    Write-Host "Other computers will auto-update when they open the app!" -ForegroundColor Green
} else {
    Write-Host "To update other computers manually, run:" -ForegroundColor Yellow
    Write-Host "  git pull origin main" -ForegroundColor White
}
Write-Host ""
