@echo off
rem Windows double-click entry point.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but wasn't found on this machine.
  echo Install it from https://nodejs.org and run this script again.
  pause
  exit /b 1
)

if not exist .env (
  copy .env.example .env >nul
  echo.
  echo Created .env -- open it and add your Anthropic API key ^(ANTHROPIC_API_KEY="..."^),
  echo then run this script again to start the app.
  echo.
  pause
  exit /b 0
)

findstr /c:"ANTHROPIC_API_KEY=\"\"" .env >nul
if not errorlevel 1 (
  echo.
  echo Warning: ANTHROPIC_API_KEY in .env is empty. Listing extraction and memo
  echo narratives will fail until you add your key there.
  echo.
)

if not exist node_modules (
  echo Installing dependencies ^(first run only, this can take a minute^)...
  call npm install
  if errorlevel 1 exit /b 1
)

dir /b prisma\migrations 2>nul | findstr "." >nul
if errorlevel 1 (
  call npx prisma migrate dev --name init
) else (
  call npx prisma generate
  call npx prisma migrate deploy
)
if errorlevel 1 exit /b 1

call npx prisma db seed

echo.
echo Starting the app -- your browser will open at http://localhost:3000 ...
start "" /min cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

call npm run dev
