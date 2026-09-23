const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");

const providerPort = 4111;
const appPort = 3100;

function providerPayload(body) {
  const system = body?.messages?.[0]?.content || "";
  let content;
  if (system.includes('"kind":"reply"')) {
    content = JSON.stringify({ kind: "reply", text: "Hi — just checking in to see if you had any questions about the proposal. Happy to clarify anything when convenient." });
  } else if (system.includes('"kind":"summary"')) {
    content = JSON.stringify({ kind: "summary", summary: "The team agreed to launch Friday.", keyPoints: ["Launch is planned for Friday.", "Sam will finish the draft Tuesday."], actions: [{ task: "Finish the draft", owner: "Sam", deadline: "Tuesday" }] });
  } else if (system.includes('"kind":"plan"')) {
    content = JSON.stringify({ kind: "plan", goal: "Prepare for the customer meeting", steps: [{ step: "Review the customer brief", detail: null }, { step: "Prepare three options", detail: null }, { step: "Send the agenda", detail: null }] });
  } else {
    content = JSON.stringify({ kind: "reply", text: "Fallback" });
  }
  return { choices: [{ message: { content } }], usage: { prompt_tokens: 100, completion_tokens: 50 } };
}

const provider = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/chat/completions") { res.writeHead(404).end(); return; }
  if (req.headers.authorization !== "Bearer test-key") { res.writeHead(401).end(); return; }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(providerPayload(body)));
});

function waitFor(url, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try { const r = await fetch(url); if (r.status < 500) return resolve(); } catch {}
      if (Date.now() - started > timeoutMs) return reject(new Error("timeout waiting for " + url));
      setTimeout(tick, 250);
    };
    tick();
  });
}

async function post(body) {
  return fetch(`http://127.0.0.1:${appPort}/api/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

(async () => {
  await new Promise(resolve => provider.listen(providerPort, "127.0.0.1", resolve));
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(appPort)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, AI_PROVIDER_API_KEY: "test-key", AI_PROVIDER_BASE_URL: `http://127.0.0.1:${providerPort}`, AI_PROVIDER_MODEL: "mock-model", AI_PROVIDER_INPUT_USD_PER_1M_TOKENS: "1", AI_PROVIDER_OUTPUT_USD_PER_1M_TOKENS: "2" }
  });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk.toString(); });
  try {
    await waitFor(`http://127.0.0.1:${appPort}`);
    const cases = [
      ["reply", "A customer has not replied to our proposal for a week. Help me follow up without sounding pushy.", "reply"],
      ["summary", "Summarize: We agreed to launch Friday. Sam will finish the draft Tuesday.", "summary"],
      ["plan", "Help me prepare for a customer meeting next Friday. I need to review their brief, prepare three options, and send an agenda.", "plan"]
    ];
    for (const [task, input, kind] of cases) {
      const r = await post({ version: 1, task, input, clarification: "" });
      assert.equal(r.status, 200);
      const data = await r.json();
      assert.equal(data.status, "result");
      assert.equal(data.workflow, task);
      assert.equal(data.result.kind, kind);
      assert.equal(data.meta.model, "mock-model");
      assert.equal(data.meta.inputTokens, 100);
      assert.equal(data.meta.outputTokens, 50);
      assert.equal(data.meta.estimatedCostUsd, 0.0002);
      assert.ok(data.meta.traceId);
    }
    const clarification = await post({ version: 1, task: "summary", input: "Summarize", clarification: "" });
    assert.equal(clarification.status, 200);
    assert.equal((await clarification.json()).status, "clarification_required");
    const unsupported = await post({ version: 1, task: "other", input: "Help me with something", clarification: "" });
    assert.equal(unsupported.status, 400);
    console.log("PASS: 3 workflows generated structured results; clarification, rejection, token usage and cost estimation verified.");
  } finally {
    child.kill("SIGTERM");
    provider.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
