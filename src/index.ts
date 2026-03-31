import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { SolRouter } from "@solrouter/sdk";

type ModelName =
  | "gpt-oss-20b"
  | "gemini-flash"
  | "claude-sonnet"
  | "claude-sonnet-4"
  | "gpt-4o-mini";

type ReasoningMode = "default" | "braid";

interface CliOptions {
  topic?: string;
  context?: string;
  contextFile?: string;
  out?: string;
  model: ModelName;
  encrypted: boolean;
  liveSearch: boolean;
  reasoning: ReasoningMode;
  systemPrompt?: string;
  chatId?: string;
  useRAG: boolean;
  ragCollection?: string;
}

const DEFAULT_MODEL: ModelName = "gpt-oss-20b";
const DEFAULT_SYSTEM_PROMPT =
  "You are a high-signal market research assistant. Be specific, cautious, and practical. Call out uncertainty instead of pretending to know more than you do.";

function printHelp(): void {
  console.log(`DarkForest Briefs

Usage:
  npm run brief -- --topic "Topic to research" [options]

Options:
  --topic "text"              Required. Main question or market topic.
  --context "text"            Optional. Sensitive local context to include.
  --context-file path         Optional. Read extra context from a local file.
  --out path                  Optional. Save markdown output to a file.
  --model name                Optional. Default: ${DEFAULT_MODEL}
  --system "text"             Optional. Override the system prompt.
  --chat-id id                Optional. Continue a prior conversation.
  --collection name           Optional. RAG collection name.
  --use-rag                   Optional. Turn on retrieval.
  --no-live-search            Optional. Disable live search.
  --unencrypted               Optional. Send the request without encryption.
  --braid                     Optional. Use SolRouter BRAID reasoning.
  --help                      Show this help text.

Examples:
  npm run brief -- --topic "Catalysts for SOL this week"
  npm run brief -- --topic "ETH beta risks into macro prints" --context-file ./notes.txt --out ./reports/eth-risk.md
  npm run brief -- --topic "JTO thesis review" --braid --collection internal-research
`);
}

function parseArgs(argv: string[]): { command: string; options: CliOptions } {
  const command = argv[0] ?? "help";
  const options: CliOptions = {
    model: DEFAULT_MODEL,
    encrypted: true,
    liveSearch: true,
    reasoning: "default",
    useRAG: false,
  };

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--topic":
        options.topic = argv[++index];
        break;
      case "--context":
        options.context = argv[++index];
        break;
      case "--context-file":
        options.contextFile = argv[++index];
        break;
      case "--out":
        options.out = argv[++index];
        break;
      case "--model":
        options.model = (argv[++index] as ModelName) ?? DEFAULT_MODEL;
        break;
      case "--system":
        options.systemPrompt = argv[++index];
        break;
      case "--chat-id":
        options.chatId = argv[++index];
        break;
      case "--collection":
        options.ragCollection = argv[++index];
        break;
      case "--use-rag":
        options.useRAG = true;
        break;
      case "--no-live-search":
        options.liveSearch = false;
        break;
      case "--unencrypted":
        options.encrypted = false;
        break;
      case "--braid":
        options.reasoning = "braid";
        break;
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { command, options };
}

async function readContext(context?: string, contextFile?: string): Promise<string> {
  const parts: string[] = [];

  if (context) {
    parts.push(context.trim());
  }

  if (contextFile) {
    const fileContents = await readFile(path.resolve(contextFile), "utf8");
    parts.push(fileContents.trim());
  }

  return parts.filter(Boolean).join("\n\n");
}

function buildPrompt(topic: string, context: string): string {
  const lines = [
    "Create a concise markdown research brief for a sensitive operator workflow.",
    "Keep the answer specific, practical, and free of generic filler.",
    "Structure the brief with these headings exactly:",
    "## Core Thesis",
    "## Catalysts",
    "## Risks",
    "## Missing Evidence",
    "## 24h Watchlist",
    "## Execution Summary",
    "",
    `Research topic: ${topic}`,
  ];

  if (context) {
    lines.push("", "Private local context:", context);
  }

  lines.push(
    "",
    "Write like the user is making a real decision soon. Note uncertainty where needed."
  );

  return lines.join("\n");
}

function renderMarkdown(
  topic: string,
  options: CliOptions,
  response: Awaited<ReturnType<SolRouter["chat"]>>
): string {
  const header = [
    "# DarkForest Briefs Report",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Topic: ${topic}`,
    `- Model: ${response.model}`,
    `- Encrypted: ${response.encrypted ? "yes" : "no"}`,
    `- Reasoning: ${options.reasoning}`,
    `- Live search: ${options.liveSearch ? "yes" : "no"}`,
  ];

  if (response.privacyAttestationId) {
    header.push(`- Privacy attestation: ${response.privacyAttestationId}`);
  }

  if (typeof response.cost === "number") {
    header.push(`- Cost (USDC): ${response.cost.toFixed(6)}`);
  }

  if (response.usage) {
    header.push(
      `- Token usage: ${response.usage.promptTokens} prompt / ${response.usage.completionTokens} completion / ${response.usage.totalTokens} total`
    );
  }

  const sections = [header.join("\n"), "", response.message.trim()];

  if (response.braidTrace) {
    sections.push(
      "",
      "## BRAID Trace Summary",
      "",
      `- GRD ID: ${response.braidTrace.grdId}`,
      `- Intent: ${response.braidTrace.intent}`,
      `- Total duration (ms): ${response.braidTrace.totalDurationMs}`,
      `- Total tokens: ${response.braidTrace.totalTokens}`,
      "",
      "```mermaid",
      response.braidTrace.grdMermaid,
      "```"
    );
  }

  return sections.join("\n");
}

async function maybeWriteReport(filePath: string | undefined, report: string): Promise<void> {
  if (!filePath) {
    return;
  }

  const absolutePath = path.resolve(filePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, report, "utf8");
  console.log(`Saved report to ${absolutePath}`);
}

async function runBrief(options: CliOptions): Promise<void> {
  if (!options.topic) {
    throw new Error("Missing required --topic argument.");
  }

  const apiKey = process.env.SOLROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("SOLROUTER_API_KEY is required.");
  }

  const context = await readContext(options.context, options.contextFile);
  const prompt = buildPrompt(options.topic, context);

  const client = new SolRouter({
    apiKey,
    baseUrl: process.env.SOLROUTER_BASE_URL || undefined,
    encrypted: options.encrypted,
  });

  try {
    const response = await client.chat(prompt, {
      model: options.model,
      encrypted: options.encrypted,
      chatId: options.chatId,
      systemPrompt: options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      useLiveSearch: options.liveSearch,
      useRAG: options.useRAG,
      ragCollection: options.ragCollection,
      reasoning: options.reasoning,
      braidOptions:
        options.reasoning === "braid"
          ? {
              includeTrace: true,
            }
          : undefined,
    });

    const report = renderMarkdown(options.topic, options, response);
    console.log(report);
    await maybeWriteReport(options.out, report);
  } finally {
    client.clearSession();
  }
}

async function main(): Promise<void> {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === "help") {
    printHelp();
    return;
  }

  if (command !== "brief") {
    throw new Error(`Unsupported command: ${command}`);
  }

  await runBrief(options);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  console.error("");
  printHelp();
  process.exit(1);
});
