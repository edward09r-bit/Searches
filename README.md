# Business Acquisition Intelligence

Paste a business-for-sale listing in, get a financially-grounded, scored
acquisition memo out: SBA debt-service math, federal/CA tax modeling, an
8-factor weighted score, and a dashboard to track everything you're
evaluating.

## Running it (one click)

1. **Install [Node.js](https://nodejs.org)** if you don't already have it (LTS version).
2. **Download this repo** and unzip it (or `git clone` it).
3. **Double-click the start script for your OS:**
   - macOS: `start.command`
   - Windows: `start.bat`
   - Linux: `start.sh` (run `./start.sh` from a terminal, or double-click if your file manager runs shell scripts)
4. **First run only:** the script creates a `.env` file and stops so you can add your Anthropic API key. Open `.env`, set `ANTHROPIC_API_KEY="sk-ant-..."`, then run the start script again.

That's it — no Docker, no database server to install, no terminal commands to type. The script installs dependencies, sets up a local SQLite database (a single file, no server), seeds it with 2025 tax brackets and default settings, and opens the app at [http://localhost:3000](http://localhost:3000).

To stop the app, close the terminal window the script opened (or press `Ctrl+C` in it).

## Manual setup (if you'd rather run it by hand)

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Other commands

- `npm test` — runs the unit test suite (financial engine, tax math, scoring, dedupe)
- `npm run lint` — ESLint
- `npm run build` / `npm start` — production build and run

## More detail

See `docs/assumptions.md` for every default this app uses (tax brackets, SBA
terms, scoring weights, the S-corp tax modeling assumption) — all editable in
the `Settings` table without touching code.
