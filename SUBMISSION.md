# Solrouter Submission Pack

## Repo Submission Title

DarkForest Briefs

## Project Description (300 words max)

DarkForest Briefs is a private research CLI for traders and operators who do not want their raw prompts, theses, or execution plans exposed to third-party AI providers. The tool uses `@solrouter/sdk` to send encrypted prompts to SolRouter, optionally with live search and BRAID reasoning, and returns a markdown brief with six sections: core thesis, catalysts, risks, missing evidence, 24h watchlist, and execution summary. The code is intentionally small so another builder can inspect exactly where privacy is preserved: the CLI constructs the brief locally, encrypts the request through SolRouter by default, and stores the final report only on the user's machine unless the user chooses otherwise. This makes it useful for sensitive workflows like token research, event-driven trade prep, portfolio risk review, or competitor analysis. The repo includes a real TypeScript implementation, local report export, environment-based configuration, and demo instructions. Private inference matters here because the query is the alpha: if your prompt reveals what you are researching, your edge is already leaking before the answer comes back.

## Form Fields To Fill In Before Submit

- Public repo URL: `[PASTE GITHUB REPO URL]`
- Demo URL or video: `[PASTE LOOM OR VIDEO URL]`
- SolRouter account / wallet address: `[PASTE WALLET ADDRESS]`
- X post URL: `[PASTE X THREAD URL]`

## Required Last-Mile Steps

- Generate a real SolRouter API key.
- Run the CLI and capture proof that it works with your account.
- Publish the repo publicly.
- Record a short loom.
- Publish the X thread in `SOCIAL_POST.md`.
