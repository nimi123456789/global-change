@echo off
echo ================================================
echo   GLOBAL CHANGE - QUICK DEPLOY TO VERCEL
echo ================================================
echo.

echo Step 1: Checking Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✓ Git is installed

echo.
echo Step 2: Initializing repository...
git init
git add .
git commit -m "Production deployment - Global Change v1.0"

echo.
echo Step 3: Instructions for GitHub...
echo.
echo Please follow these steps:
echo.
echo 1. Go to: https://github.com/new
echo 2. Create a repository named: global-change
echo 3. Copy the remote URL (e.g., https://github.com/username/global-change.git)
echo.
set /p REPO_URL="4. Paste your GitHub repository URL here: "

echo.
echo Step 4: Pushing to GitHub...
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo Step 5: Deploy to Vercel...
echo.
echo Now:
echo 1. Go to: https://vercel.com/new
echo 2. Import your GitHub repository
echo 3. Click "Deploy"
echo.
echo Your site will be live in ~30 seconds!
echo.
pause
