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
    [switch]$SkipBuild = $false,
    [switch]$RequireClean = $false
)

# Stop on any error by default
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   ScanMaster Release Tool" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# ── Pre-flight checks ────────────────────────────────────────────────

# 1. Make sure we are in the repo root
if (-not (Test-Path "package.json")) {
    Write-Err "package.json not found – run this script from the repo root."
    exit 1
}

# 2. Make sure git is clean only when explicitly requested.
# By default we continue and let the release commit capture current non-ignored changes.
$gitStatus = git status --porcelain 2>&1
if ($gitStatus) {
    Write-Warn "WARNING: You have uncommitted changes:"
    Write-Host $gitStatus
    Write-Host ""
    if ($RequireClean) {
        Write-Err "Aborted. Commit or stash your changes first."
        exit 1
    }
    Write-Warn "Continuing with dirty working tree. The release commit will include all non-ignored changes."
    Write-Host ""
}

# 3. Make sure we can reach the remote
Write-Info "Checking remote connectivity..."
git ls-remote origin HEAD > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Cannot reach remote 'origin'. Check your internet / credentials."
    exit 1
}

# 4. Check GitHub CLI is available (needed for release)
$ghAvailable = $null -ne (Get-Command "gh" -ErrorAction SilentlyContinue)
if (-not $ghAvailable) {
    Write-Warn "GitHub CLI (gh) not installed – release upload will be skipped."
    Write-Warn "Install: winget install GitHub.cli && gh auth login"
    Write-Host ""
}

# ── Version bump ─────────────────────────────────────────────────────

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Info "Current version: v$currentVersion"

$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

switch ($BumpType.ToLower()) {
    "major" { $major++; $minor = 0; $patch = 0 }
    "minor" { $minor++; $patch = 0 }
    "patch" { $patch++ }
    default {
        Write-Warn "Unknown bump type '$BumpType', using 'patch'"
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
Write-Success "New version: v$newVersion"

# Check if this tag already exists locally or remotely
$existingTag = git tag -l "v$newVersion" 2>&1
if ($existingTag) {
    Write-Err "Tag v$newVersion already exists locally! Aborting to prevent duplicate."
    Write-Err "If you want to re-release, first delete the tag: git tag -d v$newVersion"
    exit 1
}

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

# ── Git: commit, tag, push ───────────────────────────────────────────

Write-Info "Staging changes..."
git add -A

# Safety check: make sure release artifacts are NOT staged
$stagedReleaseFiles = git diff --cached --name-only | Select-String -Pattern "^release-" -SimpleMatch
if ($stagedReleaseFiles) {
    Write-Err "SAFETY: Release build files are staged for commit!"
    Write-Err "These files should be in .gitignore:"
    $stagedReleaseFiles | ForEach-Object { Write-Err "  $_" }
    Write-Err "Unstaging them now..."
    git reset HEAD -- release-*/ 2>$null
    git reset HEAD -- release-v*/ 2>$null
}

# Also make sure no file over 90MB is staged (GitHub limit is 100MB)
$largeFiles = git diff --cached --name-only | ForEach-Object {
    if (Test-Path $_) {
        $size = (Get-Item $_).Length / 1MB
        if ($size -gt 90) {
            [PSCustomObject]@{ Name = $_; SizeMB = [math]::Round($size, 1) }
        }
    }
}
if ($largeFiles) {
    Write-Err "SAFETY: Large files (>90MB) detected in staging – GitHub will reject these!"
    $largeFiles | ForEach-Object { Write-Err "  $($_.Name) ($($_.SizeMB) MB)" }
    Write-Err "Aborting. Add these patterns to .gitignore and try again."
    # Revert the version bump
    $packageJson.version = $currentVersion
    $revertJson = $packageJson | ConvertTo-Json -Depth 100
    [System.IO.File]::WriteAllText((Resolve-Path "package.json").Path, $revertJson, $utf8NoBOM)
    exit 1
}

Write-Info "Creating commit..."
git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Err "Git commit failed. Aborting."
    exit 1
}

Write-Info "Creating tag v$newVersion..."
git tag "v$newVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Git tag failed. Aborting."
    exit 1
}

Write-Info "Pushing to origin..."
git push origin main --tags
if ($LASTEXITCODE -ne 0) {
    Write-Err "============================================="
    Write-Err "  Git push FAILED!"
    Write-Err "  The commit and tag were created locally."
    Write-Err "  Fix the issue, then retry with:"
    Write-Err "    git push origin main --tags"
    Write-Err "============================================="
    Write-Err ""
    Write-Err "Common causes:"
    Write-Err "  - Large files in history (use git filter-repo to clean)"
    Write-Err "  - Network / auth issues"
    Write-Err "  - Remote branch is ahead (git pull --rebase first)"
    exit 1
}
Write-Success "Push successful!"

# ── Electron build ───────────────────────────────────────────────────

$freshOutputDir = $null
$buildOK = $false

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

    # Clean build folders to prevent stale artifacts
    Write-Info "Cleaning dist-electron..."
    if (Test-Path "dist-electron") {
        Remove-Item -Path "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Use a fresh timestamped output directory to avoid Windows file-lock issues
    $buildTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $freshOutputDir = "release-build-$buildTimestamp"
    Write-Info "  Build output directory: $freshOutputDir"

    # Temporarily update electron-builder.json with the fresh output dir
    $ebJsonPath = "electron-builder.json"
    $ebJsonRaw = Get-Content $ebJsonPath -Raw
    $ebJson = $ebJsonRaw | ConvertFrom-Json
    $originalOutputDir = $ebJson.directories.output
    $ebJson.directories.output = $freshOutputDir
    $ebJsonContent = $ebJson | ConvertTo-Json -Depth 100
    $utf8NoBOM2 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Resolve-Path $ebJsonPath).Path, $ebJsonContent, $utf8NoBOM2)

    try {
        npm run dist:win
        $buildExitCode = $LASTEXITCODE
    } catch {
        Write-Err "Build threw an exception: $_"
        $buildExitCode = 1
    } finally {
        # ALWAYS restore the original output dir, even if build fails or is interrupted
        $ebJson.directories.output = $originalOutputDir
        $ebJsonRestored = $ebJson | ConvertTo-Json -Depth 100
        [System.IO.File]::WriteAllText((Resolve-Path $ebJsonPath).Path, $ebJsonRestored, $utf8NoBOM2)
        Write-Info "  electron-builder.json restored to output: $originalOutputDir"
    }

    if ($buildExitCode -ne 0) {
        Write-Err "Build failed (exit code $buildExitCode)!"
        Write-Warn "You can manually build later with: npm run dist:win"
    }

    # ── Validate build output ────────────────────────────────────────

    Write-Host ""
    Write-Info "Validating build output in: $freshOutputDir"

    $installerPath = Join-Path $freshOutputDir "ScanMaster-Setup-$newVersion.exe"
    $portablePath  = Join-Path $freshOutputDir "ScanMaster-Portable-$newVersion.exe"
    $latestYmlPath = Join-Path $freshOutputDir "latest.yml"
    $buildOK = $true

    # Check installer exists and is reasonable size (>50MB)
    if (Test-Path $installerPath) {
        $installerSize = (Get-Item $installerPath).Length / 1MB
        if ($installerSize -lt 50) {
            Write-Err "  INSTALLER TOO SMALL: $([math]::Round($installerSize, 1)) MB (expected >50 MB)"
            $buildOK = $false
        } else {
            Write-Success "  Installer OK: $([math]::Round($installerSize, 1)) MB"
        }
    } else {
        Write-Err "  Installer not found: $installerPath"
        $buildOK = $false
    }

    # Check portable exists
    if (Test-Path $portablePath) {
        $portableSize = (Get-Item $portablePath).Length / 1MB
        Write-Success "  Portable OK: $([math]::Round($portableSize, 1)) MB"
    } else {
        Write-Warn "  Portable not found (optional): $portablePath"
    }

    # Check latest.yml exists and has correct version
    if (Test-Path $latestYmlPath) {
        $ymlContent = Get-Content $latestYmlPath -Raw
        if ($ymlContent -match "version:\s*$([regex]::Escape($newVersion))") {
            Write-Success "  latest.yml OK: version $newVersion"
        } else {
            Write-Err "  latest.yml has WRONG version (expected $newVersion)"
            Write-Err "  Content: $($ymlContent.Substring(0, [Math]::Min(200, $ymlContent.Length)))"
            $buildOK = $false
        }
    } else {
        Write-Err "  latest.yml not found: $latestYmlPath"
        $buildOK = $false
    }

    if (-not $buildOK) {
        Write-Host ""
        Write-Err "Build validation FAILED. Installer files will NOT be uploaded."
    }
}

# ── GitHub Release ───────────────────────────────────────────────────

if ($ghAvailable) {
    Write-Host ""
    Write-Info "Creating GitHub Release..."

    $releaseNotes = "## What's New`n`n"
    if ($Message -ne "") {
        $releaseNotes += "- $Message`n"
    } else {
        $releaseNotes += "- Version bump to v$newVersion`n"
    }
    $releaseNotes += "`n**Full Changelog**: https://github.com/amitay1/Scan-Master-16-12-25/compare/v$currentVersion...v$newVersion"

    # Create the release (handle "already exists" gracefully)
    $releaseResult = gh release create "v$newVersion" --title "$releaseTitle" --notes "$releaseNotes" 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($releaseResult -match "already exists") {
            Write-Warn "  Release v$newVersion already exists on GitHub – will upload files to existing release."
        } else {
            Write-Err "  Failed to create GitHub release: $releaseResult"
            Write-Err "  You can create it manually: gh release create v$newVersion --title `"$releaseTitle`""
        }
    } else {
        Write-Success "  GitHub Release v$newVersion created!"
    }

    # Upload installer files only if build validation passed
    if ($buildOK -and $freshOutputDir -and (Test-Path $freshOutputDir)) {
        Write-Info "Uploading installer files to release..."

        $filesToUpload = @(
            @{ Path = (Join-Path $freshOutputDir "latest.yml");                                 Name = "latest.yml" },
            @{ Path = (Join-Path $freshOutputDir "ScanMaster-Setup-$newVersion.exe");           Name = "Setup EXE" },
            @{ Path = (Join-Path $freshOutputDir "ScanMaster-Setup-$newVersion.exe.blockmap");  Name = "Blockmap" },
            @{ Path = (Join-Path $freshOutputDir "ScanMaster-Portable-$newVersion.exe");        Name = "Portable EXE" }
        )

        $uploadFailed = $false
        foreach ($file in $filesToUpload) {
            if (Test-Path $file.Path) {
                Write-Info "  Uploading: $($file.Name)..."
                gh release upload "v$newVersion" "$($file.Path)" --clobber 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Err "  FAILED to upload $($file.Name)!"
                    $uploadFailed = $true
                } else {
                    Write-Success "  Uploaded: $($file.Name)"
                }
            } else {
                Write-Warn "  Not found: $($file.Path) (skipping)"
            }
        }

        if ($uploadFailed) {
            Write-Host ""
            Write-Err "Some uploads failed. Retry manually:"
            Write-Err "  gh release upload v$newVersion $freshOutputDir/latest.yml --clobber"
            Write-Err "  gh release upload v$newVersion $freshOutputDir/ScanMaster-Setup-$newVersion.exe --clobber"
        } else {
            Write-Success "All files uploaded to GitHub Release!"
        }

    } elseif (-not $SkipBuild -and -not $buildOK) {
        Write-Host ""
        Write-Err "================================================"
        Write-Err "  BUILD VALIDATION FAILED - No files uploaded!"
        Write-Err "  The GitHub release was created but is EMPTY."
        Write-Err "  Fix the build and run: npm run dist:win"
        Write-Err "  Then manually upload files with:"
        Write-Err "    gh release upload v$newVersion <build-dir>/latest.yml --clobber"
        Write-Err "    gh release upload v$newVersion <build-dir>/ScanMaster-Setup-$newVersion.exe --clobber"
        Write-Err "    gh release upload v$newVersion <build-dir>/ScanMaster-Setup-$newVersion.exe.blockmap --clobber"
        Write-Err "    gh release upload v$newVersion <build-dir>/ScanMaster-Portable-$newVersion.exe --clobber"
        Write-Err "================================================"
    } elseif ($SkipBuild) {
        Write-Warn "Build was skipped – no installer files uploaded."
        Write-Warn "Run the build manually and upload:"
        Write-Warn "  npm run dist:win"
        Write-Warn "  gh release upload v$newVersion release-build/latest.yml --clobber"
        Write-Warn "  gh release upload v$newVersion release-build/ScanMaster-Setup-$newVersion.exe --clobber"
    }
} else {
    Write-Host ""
    Write-Warn "GitHub CLI (gh) not installed – skipping GitHub Release creation."
    Write-Warn "Auto-update won't work without a GitHub Release."
    Write-Warn "Install GitHub CLI: winget install GitHub.cli"
    Write-Warn "Then run: gh auth login"
}

# ── Cleanup old build dirs (keep last 3) ─────────────────────────────

$oldBuildDirs = Get-ChildItem -Directory -Filter "release-build-*" | Sort-Object Name -Descending | Select-Object -Skip 3
if ($oldBuildDirs) {
    Write-Host ""
    Write-Info "Cleaning up old build directories..."
    foreach ($dir in $oldBuildDirs) {
        Write-Info "  Removing: $($dir.Name)"
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# ── Summary ──────────────────────────────────────────────────────────

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Success "Released v$newVersion!"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($ghAvailable -and -not $SkipBuild -and $buildOK) {
    Write-Host "Auto-update: Other computers will update when they open the app!" -ForegroundColor Green
} elseif (-not $buildOK) {
    Write-Host "WARNING: Build failed – auto-update will NOT work until fixed!" -ForegroundColor Red
} elseif ($SkipBuild) {
    Write-Host "Build was skipped – remember to build and upload manually." -ForegroundColor Yellow
} else {
    Write-Host "To update other computers manually, run:" -ForegroundColor Yellow
    Write-Host "  git pull origin main" -ForegroundColor White
}
Write-Host ""
