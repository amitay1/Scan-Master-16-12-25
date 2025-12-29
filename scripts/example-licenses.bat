@echo off
REM Example License Generation Script for Scan Master
REM Run this to generate sample licenses for testing

echo ========================================
echo Scan Master - Generate Example Licenses
echo ========================================
echo.

REM Example 1: Basic License (AMS + ASTM)
echo [1/5] Generating Basic License...
node license-generator.js --factory "Acme Corporation" --standards AMS,ASTM --lifetime
echo.
echo ----------------------------------------
echo.

REM Example 2: Full License (All Standards)
echo [2/5] Generating Full License...
node license-generator.js --factory "Boeing Defense" --standards AMS,ASTM,BS3,BS4,MIL --lifetime
echo.
echo ----------------------------------------
echo.

REM Example 3: Trial License (1 year)
echo [3/5] Generating Trial License...
node license-generator.js --factory "Trial Company" --standards AMS --expiry 2026-12-29
echo.
echo ----------------------------------------
echo.

REM Example 4: Premium License (AMS + MIL)
echo [4/5] Generating Premium License...
node license-generator.js --factory "Lockheed Martin" --standards AMS,MIL --lifetime
echo.
echo ----------------------------------------
echo.

REM Example 5: European License (BS3 + BS4)
echo [5/5] Generating European License...
node license-generator.js --factory "Airbus Industries" --standards BS3,BS4 --lifetime
echo.
echo ----------------------------------------
echo.

echo.
echo ========================================
echo Done! All licenses generated.
echo Check the 'licenses/' folder.
echo ========================================
pause
