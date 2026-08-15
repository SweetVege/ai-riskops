import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const defaultSamplePath = "samples/real-intake-sample.json";
const defaultIngestUrl = "https://ai-riskops.vercel.app/api/ingest/model-call";
const allowedSources = new Set(["gateway_proxy", "sdk", "log_api", "agent_tool_audit"]);
const allowedDataTypes = new Set(["Customer Data", "Financial Data", "Employee Data", "General Data"]);
const allowedEnvironments = new Set(["Production", "Test", "production", "test"]);

function usage() {
  return `Usage:
  node scripts/replay-real-sample.mjs [--file samples/real-intake-sample.json] [--url https://ai-riskops.vercel.app/api/ingest/model-call] [--send] [--limit 12]

Default mode is dry-run. It validates and summarizes the sample file without sending data.

Environment variables:
  AI_RISKOPS_INGEST_URL        Optional target URL. Defaults to production demo ingestion endpoint.
  AI_RISKOPS_APPLICATION_KEY   Required only when --send is used.
`;
}

function parseArgs(argv) {
  const args = {
    file: defaultSamplePath,
    url: process.env.AI_RISKOPS_INGEST_URL || defaultIngestUrl,
    send: false,
    limit: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--send") {
      args.send = true;
      continue;
    }

    if (arg === "--file") {
      args.file = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--url") {
      args.url = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const limit = Number(argv[index + 1]);
      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("--limit must be a positive integer.");
      }
      args.limit = limit;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function readSamples(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  const samples = Array.isArray(parsed) ? parsed : parsed.samples;

  if (!Array.isArray(samples)) {
    throw new Error("Sample file must contain an array or an object with a samples array.");
  }

  return samples;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateSample(sample, index) {
  const errors = [];
  const label = `sample[${index}]`;
  const source = text(sample.ingestionSource) || "sdk";
  const environment = text(sample.environment) || "Production";
  const dataType = text(sample.context?.dataType);
  const traceId = text(sample.request?.traceId);
  const occurredAt = text(sample.request?.occurredAt);
  const userRole = text(sample.user?.role);
  const modelName = typeof sample.model === "string" ? sample.model : text(sample.model?.name);
  const capturedFields = [
    ["content.prompt", text(sample.content?.prompt)],
    ["content.output", text(sample.content?.output)],
    ["context.ragContext", text(sample.context?.ragContext)],
    ["agent.toolCall", text(sample.agent?.toolCall) || text(sample.agent?.toolName)],
  ].filter(([, value]) => value);

  if (!allowedSources.has(source)) errors.push(`${label}: unsupported ingestionSource "${source}"`);
  if (!allowedEnvironments.has(environment)) errors.push(`${label}: unsupported environment "${environment}"`);
  if (!allowedDataTypes.has(dataType)) errors.push(`${label}: unsupported context.dataType "${dataType}"`);
  if (!traceId) errors.push(`${label}: request.traceId is required for replay traceability`);
  if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) errors.push(`${label}: request.occurredAt must be an ISO timestamp`);
  if (!userRole) errors.push(`${label}: user.role is recommended and required by this replay validator`);
  if (!modelName) errors.push(`${label}: model.name is recommended and required by this replay validator`);
  if (capturedFields.length === 0) errors.push(`${label}: at least one captured prompt/output/RAG/tool field is required`);

  return errors;
}

function summarize(samples) {
  const bySource = new Map();
  const byDataType = new Map();
  const byEnvironment = new Map();
  let promptCount = 0;
  let outputCount = 0;
  let ragCount = 0;
  let toolCount = 0;

  for (const sample of samples) {
    const source = text(sample.ingestionSource) || "sdk";
    const dataType = text(sample.context?.dataType) || "Unknown";
    const environment = text(sample.environment) || "Production";

    bySource.set(source, (bySource.get(source) || 0) + 1);
    byDataType.set(dataType, (byDataType.get(dataType) || 0) + 1);
    byEnvironment.set(environment, (byEnvironment.get(environment) || 0) + 1);

    if (text(sample.content?.prompt)) promptCount += 1;
    if (text(sample.content?.output)) outputCount += 1;
    if (text(sample.context?.ragContext)) ragCount += 1;
    if (text(sample.agent?.toolCall) || text(sample.agent?.toolName)) toolCount += 1;
  }

  return {
    total: samples.length,
    bySource: Object.fromEntries(bySource),
    byDataType: Object.fromEntries(byDataType),
    byEnvironment: Object.fromEntries(byEnvironment),
    capturedFields: {
      prompt: promptCount,
      output: outputCount,
      ragContext: ragCount,
      toolCall: toolCount,
    },
  };
}

async function sendSample(sample, url, applicationKey) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${applicationKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sample),
  });
  const payload = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    traceId: text(sample.request?.traceId),
    callLogId: payload?.data?.callLog?.id ?? null,
    riskEventId: payload?.data?.riskEvent?.id ?? null,
    action: payload?.data?.evaluation?.action ?? null,
    level: payload?.data?.evaluation?.level ?? null,
    errorCode: payload?.error?.code ?? null,
    message: payload?.error?.message ?? null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const samples = readSamples(args.file);
  const selectedSamples = args.limit ? samples.slice(0, args.limit) : samples;
  const validationErrors = selectedSamples.flatMap((sample, index) => validateSample(sample, index));

  console.log("AI RiskOps real-data sample replay");
  console.log(JSON.stringify({
    mode: args.send ? "send" : "dry-run",
    file: args.file,
    url: args.url,
    sampleCount: selectedSamples.length,
  }, null, 2));
  console.log(JSON.stringify(summarize(selectedSamples), null, 2));

  if (validationErrors.length > 0) {
    console.error("Validation failed:");
    for (const error of validationErrors) console.error(`- ${error}`);
    process.exit(1);
  }

  if (!args.send) {
    console.log("Dry-run passed. Add --send and AI_RISKOPS_APPLICATION_KEY to replay samples into AI RiskOps.");
    return;
  }

  const applicationKey = process.env.AI_RISKOPS_APPLICATION_KEY;
  if (!applicationKey) {
    throw new Error("AI_RISKOPS_APPLICATION_KEY is required when --send is used.");
  }

  const results = [];
  for (const sample of selectedSamples) {
    const result = await sendSample(sample, args.url, applicationKey);
    results.push(result);
    console.log(JSON.stringify(result));
  }

  const succeeded = results.filter((result) => result.ok).length;
  const failed = results.length - succeeded;
  const riskEvents = results.filter((result) => result.riskEventId).length;

  console.log(JSON.stringify({
    replayComplete: true,
    succeeded,
    failed,
    riskEvents,
  }, null, 2));

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
