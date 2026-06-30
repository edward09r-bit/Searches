#!/usr/bin/env bash
# Double-click entry point (macOS uses start.command, which just calls this).
# Sets up the app on first run, then starts it and opens your browser.
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but wasn't found on this machine."
  echo "Install it from https://nodejs.org and run this script again."
  read -p "Press Enter to close..." _
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "Created .env — open it and add your Anthropic API key (ANTHROPIC_API_KEY=\"...\"),"
  echo "then run this script again to start the app."
  echo ""
  read -p "Press Enter to close..." _
  exit 0
fi

if grep -q 'ANTHROPIC_API_KEY=""' .env 2>/dev/null; then
  echo ""
  echo "Warning: ANTHROPIC_API_KEY in .env is empty. Listing extraction and memo"
  echo "narratives will fail until you add your key there."
  echo ""
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only, this can take a minute)..."
  npm install
fi

if [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate dev --name init
else
  npx prisma generate
  npx prisma migrate deploy
fi

npx prisma db seed

echo ""
echo "Starting the app — your browser will open at http://localhost:3000 ..."
(
  for _ in $(seq 1 30); do
    sleep 1
    if curl -s -o /dev/null http://localhost:3000; then
      if command -v open >/dev/null 2>&1; then open http://localhost:3000
      elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:3000
      fi
      break
    fi
  done
) &

npm run dev
