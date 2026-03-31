# DarkForest Briefs

DarkForest Briefs is a privacy-first research CLI built on `@solrouter/sdk`. It turns a sensitive market question into a structured markdown brief without shipping your raw prompt in plaintext to a generic AI backend.

This repo is designed for the Solrouter "Ship With Encrypted AI" bounty and intentionally keeps the code surface small so it is obvious where privacy matters and how Solrouter is being used.

## Why private inference makes sense here

In trading, portfolio analysis, or competitive research, the prompt is often the edge. If your raw query reveals what you are researching, you have already leaked the interesting part. DarkForest Briefs uses SolRouter with encryption enabled by default so the sensitive question itself is protected before it leaves the device.

## What the tool does

- Takes a research topic from the CLI.
- Optionally mixes in private local context from a string or file.
- Sends the prompt through SolRouter with encryption on by default.
- Optionally enables live search and BRAID reasoning.
- Returns a markdown brief with:
  - `Core Thesis`
  - `Catalysts`
  - `Risks`
  - `Missing Evidence`
  - `24h Watchlist`
  - `Execution Summary`
- Can save the result directly to a local markdown file.

## Quickstart

1. Get an API key from [solrouter.com/api](https://solrouter.com/api).
2. Install dependencies:

```bash
npm install
```

3. Set your key:

```bash
export SOLROUTER_API_KEY=sk_solrouter_your_key_here
```

4. Run a brief:

```bash
npm run brief -- --topic "Catalysts for SOL this week"
```

5. Save the report locally:

```bash
npm run brief -- --topic "Event risks for BTC into payrolls" --out ./reports/btc-payrolls.md
```

6. Include private notes from a local file:

```bash
npm run brief -- --topic "JTO thesis review" --context-file ./notes/jto.txt --out ./reports/jto.md
```

## Optional flags

- `--braid`: use SolRouter BRAID reasoning and include the returned trace if available.
- `--no-live-search`: disable live web search.
- `--unencrypted`: opt out of encryption for non-sensitive requests.
- `--use-rag --collection my-collection`: turn on retrieval if you have a configured collection.

## Demo checklist for the bounty

- Create a real SolRouter API key and wallet-backed account.
- Run the CLI once with encryption enabled.
- Capture one screenshot or loom of the command and the generated markdown report.
- Publish the repo.
- Post the included X thread and tag `@SolRouterAI`.

## Project structure

- `src/index.ts`: the full CLI.
- `SUBMISSION.md`: ready-to-paste project description and Superteam notes.
- `SOCIAL_POST.md`: a 5-tweet X thread.
- `VIDEO_SCRIPT.md`: a sub-60-second demo outline.
